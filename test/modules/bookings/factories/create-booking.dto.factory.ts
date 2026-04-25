import { CreateBookingDto } from 'src/modules/bookings/application/dtos';
import { EnrollmentType } from 'src/modules/bookings/domain/interfaces';

type CreateBookingDtoOverrides = Partial<CreateBookingDto>;

export function makeCreateBookingDto(
  overrides: CreateBookingDtoOverrides = {},
): CreateBookingDto {
  return {
    tripInstanceId: overrides.tripInstanceId ?? 'trip-instance-id-stub',
    enrollmentType: overrides.enrollmentType ?? EnrollmentType.ONE_WAY,
    recordedPrice: overrides.recordedPrice ?? 49.9,
    boardingStop: overrides.boardingStop ?? 'A1',
    alightingStop: overrides.alightingStop ?? 'B3',
  };
}
