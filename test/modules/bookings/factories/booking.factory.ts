import { Booking } from 'src/modules/bookings/domain/entities';
import { EnrollmentType } from 'src/modules/bookings/domain/interfaces';
import { Money } from 'src/shared/domain/entities/value-objects';
import type { Status } from 'src/shared/domain/types';

type BookingOverrides = Partial<{
  id: string;
  organizationId: string;
  userId: string;
  tripInstanceId: string;
  enrollmentDate: Date;
  status: Status;
  presenceConfirmed: boolean;
  enrollmentType: EnrollmentType;
  recordedPrice: number;
  boardingStop: string;
  alightingStop: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export function makeBooking(overrides: BookingOverrides = {}): Booking {
  return Booking.restore({
    id: overrides.id ?? 'booking-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    userId: overrides.userId ?? 'user-id-stub',
    tripInstanceId: overrides.tripInstanceId ?? 'trip-instance-id-stub',
    enrollmentDate: overrides.enrollmentDate ?? new Date(),
    status: overrides.status ?? 'ACTIVE',
    presenceConfirmed: overrides.presenceConfirmed ?? false,
    enrollmentType: overrides.enrollmentType ?? EnrollmentType.ONE_WAY,
    recordedPrice: Money.create(overrides.recordedPrice ?? 49.9),
    boardingStop: overrides.boardingStop ?? 'A1',
    alightingStop: overrides.alightingStop ?? 'B3',
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  });
}
