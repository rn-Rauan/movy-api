import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { Money } from 'src/shared/domain/entities/value-objects';

type TripInstanceOverrides = Partial<{
  id: string;
  organizationId: string;
  tripTemplateId: string;
  driverId: string | null;
  vehicleId: string | null;
  tripStatus: TripStatus;
  minRevenue: number | null;
  autoCancelAt: Date | null;
  forceConfirm: boolean;
  totalCapacity: number;
  isPublic: boolean;
  departureTime: Date;
  arrivalEstimate: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

function toMoney(value: number | null | undefined): Money | null {
  if (value === null || value === undefined) return null;
  return Money.create(value);
}

export function makeTripInstance(
  overrides: TripInstanceOverrides = {},
): TripInstance {
  const departure = overrides.departureTime ?? new Date();
  const arrival =
    overrides.arrivalEstimate ?? new Date(departure.getTime() + 3600000); // +1h

  const props = {
    id: overrides.id ?? crypto.randomUUID(),
    organizationId: overrides.organizationId ?? 'org-id-stub',
    tripTemplateId: overrides.tripTemplateId ?? 'template-id-stub',
    driverId: overrides.driverId ?? null,
    vehicleId: overrides.vehicleId ?? null,
    minRevenue: toMoney(overrides.minRevenue ?? null),
    autoCancelAt: overrides.autoCancelAt ?? null,
    totalCapacity: overrides.totalCapacity ?? 20,
    isPublic: overrides.isPublic ?? false,
    departureTime: departure,
    arrivalEstimate: arrival,
  };

  if (
    overrides.tripStatus !== undefined ||
    overrides.forceConfirm !== undefined ||
    overrides.createdAt !== undefined ||
    overrides.updatedAt !== undefined
  ) {
    return TripInstance.restore({
      ...props,
      tripStatus: overrides.tripStatus ?? TripStatus.SCHEDULED,
      forceConfirm: overrides.forceConfirm ?? false,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    });
  }

  return TripInstance.create(props);
}
