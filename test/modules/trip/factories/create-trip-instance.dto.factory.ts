import { CreateTripInstanceDto } from 'src/modules/trip/application/dtos';

type CreateTripInstanceDtoOverrides = Partial<CreateTripInstanceDto>;

export function makeCreateTripInstanceDto(
  overrides: CreateTripInstanceDtoOverrides = {},
): CreateTripInstanceDto {
  const departureTime =
    overrides.departureTime ?? new Date(Date.now() + 86400000).toISOString(); // +1 day
  const arrivalEstimate =
    overrides.arrivalEstimate ??
    new Date(new Date(departureTime).getTime() + 3600000).toISOString(); // +1h from departure

  return {
    tripTemplateId: overrides.tripTemplateId ?? 'trip-template-id-stub',
    departureTime,
    arrivalEstimate,
    totalCapacity: overrides.totalCapacity ?? 20,
    driverId: overrides.driverId ?? null,
    vehicleId: overrides.vehicleId ?? null,
    minRevenue: overrides.minRevenue ?? null,
  };
}
