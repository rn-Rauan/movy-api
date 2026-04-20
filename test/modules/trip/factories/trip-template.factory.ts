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
    priceOneWay: toMoney(overrides.priceOneWay, 12.5),
    priceReturn: toMoney(overrides.priceReturn, null),
    priceRoundTrip: toMoney(overrides.priceRoundTrip, null),
    isPublic: overrides.isPublic ?? false,
    isRecurring: overrides.isRecurring ?? false,
    autoCancelEnabled: overrides.autoCancelEnabled ?? false,
    minRevenue: toMoney(overrides.minRevenue, null),
    autoCancelOffset: overrides.autoCancelOffset ?? null,
  };

  if (overrides.status !== undefined) {
    return TripTemplate.restore({
      ...props,
      status: overrides.status,
    });
  }

  return TripTemplate.create(props);
}
