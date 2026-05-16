import { CreateTripInstanceDto } from 'src/modules/trip/application/dtos';

type CreateTripInstanceDtoOverrides = Partial<CreateTripInstanceDto>;

function tomorrowISODate(): string {
  const tomorrow = new Date(Date.now() + 86_400_000);
  return tomorrow.toISOString().slice(0, 10);
}

export function makeCreateTripInstanceDto(
  overrides: CreateTripInstanceDtoOverrides = {},
): CreateTripInstanceDto {
  return {
    tripTemplateId: overrides.tripTemplateId ?? 'trip-template-id-stub',
    departureDate: overrides.departureDate ?? tomorrowISODate(),
    totalCapacity: overrides.totalCapacity ?? 20,
    driverId: overrides.driverId ?? null,
    vehicleId: overrides.vehicleId ?? null,
    minRevenue: overrides.minRevenue ?? null,
  };
}
