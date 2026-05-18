import { TripTemplate } from 'src/modules/trip/domain/entities';
import { DayOfWeek } from 'src/modules/trip/domain/interfaces/enums/day-of-week.enum';
import { Shift } from 'src/modules/trip/domain/interfaces/enums/shift.enum';
import { Money } from 'src/shared/domain/entities/value-objects';
import type { Status } from 'src/shared/domain/types';

type TripTemplateOverrides = Partial<{
  id: string;
  organizationId: string;
  departurePoint: string;
  destination: string;
  stops: string[];
  shift: Shift;
  frequency: DayOfWeek[];
  departureTimeOfDay: string | null;
  arrivalTimeOfDay: string | null;
  defaultCapacity: number | null;
  defaultDriverId: string | null;
  defaultVehicleId: string | null;
  priceOneWay: number | null;
  priceReturn: number | null;
  priceRoundTrip: number | null;
  isPublic: boolean;
  isRecurring: boolean;
  autoCancelEnabled: boolean;
  minRevenue: number | null;
  autoCancelOffset: number | null;
  status: Status;
}>;

function toMoney(
  value: number | null | undefined,
  fallback: number | null,
): Money | null {
  const resolved = value ?? fallback;
  if (resolved === null) {
    return null;
  }
  return Money.create(resolved);
}

export function makeTripTemplate(
  overrides: TripTemplateOverrides = {},
): TripTemplate {
  const props = {
    id: overrides.id ?? 'trip-template-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    departurePoint: overrides.departurePoint ?? 'Terminal Rodoviário',
    destination: overrides.destination ?? 'Universidade Federal',
    stops: overrides.stops ?? [
      'Terminal Rodoviário',
      'Praça Central',
      'Universidade Federal',
    ],
    shift: overrides.shift ?? Shift.MORNING,
    frequency: overrides.frequency ?? [],
    departureTimeOfDay:
      overrides.departureTimeOfDay === null
        ? null
        : (overrides.departureTimeOfDay ?? '07:30'),
    arrivalTimeOfDay:
      overrides.arrivalTimeOfDay === null
        ? null
        : (overrides.arrivalTimeOfDay ?? '08:30'),
    defaultCapacity:
      overrides.defaultCapacity === null
        ? null
        : (overrides.defaultCapacity ?? 20),
    defaultDriverId: overrides.defaultDriverId ?? null,
    defaultVehicleId: overrides.defaultVehicleId ?? null,
    priceOneWay: toMoney(overrides.priceOneWay, 12.5),
    priceReturn: toMoney(overrides.priceReturn, null),
    priceRoundTrip: toMoney(overrides.priceRoundTrip, null),
    isPublic: overrides.isPublic ?? false,
    isRecurring: overrides.isRecurring ?? false,
    autoCancelEnabled: overrides.autoCancelEnabled ?? false,
    minRevenue: toMoney(overrides.minRevenue, null),
    autoCancelOffset: overrides.autoCancelOffset ?? null,
  };

  // restore() bypasses domain invariants — required when overriding status or
  // simulating legacy rows that pre-date the time-of-day / capacity migration.
  const needsRestore =
    overrides.status !== undefined ||
    props.departureTimeOfDay === null ||
    props.arrivalTimeOfDay === null ||
    props.defaultCapacity === null;

  if (needsRestore) {
    return TripTemplate.restore({
      ...props,
      status: overrides.status ?? 'ACTIVE',
    });
  }

  return TripTemplate.create(props);
}
