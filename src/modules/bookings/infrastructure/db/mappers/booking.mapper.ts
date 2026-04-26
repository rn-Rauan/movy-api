import { Enrollment as PrismaEnrollment } from 'generated/prisma/client';
import { Booking } from 'src/modules/bookings/domain/entities';
import { EnrollmentType } from 'src/modules/bookings/domain/interfaces';
import { Money } from 'src/shared';
import type { Status } from 'src/shared/domain/types';

/**
 * BookingMapper
 *
 * Responsibility:
 * - Map between Prisma Enrollment (persistence) and Booking (domain)
 * - Hydrate Money value objects from raw database Decimal values
 * - Convert domain entity to persistence format
 */
export class BookingMapper {
  /**
   * Map a raw Prisma Enrollment row to a Booking domain object.
   * @param raw - PrismaEnrollment row from database
   * @returns Hydrated Booking domain entity
   */
  static toDomain(raw: PrismaEnrollment): Booking {
    return Booking.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      userId: raw.userId,
      tripInstanceId: raw.tripInstanceId,
      enrollmentDate: raw.enrollmentDate,
      status: raw.status as Status,
      presenceConfirmed: raw.presenceConfirmed,
      enrollmentType: raw.enrollmentType as EnrollmentType,
      recordedPrice: Money.restore(Number(raw.recordedPrice)),
      boardingStop: raw.boardingStop,
      alightingStop: raw.alightingStop,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map a Booking domain object to a plain object suitable for Prisma persistence.
   * @param entity - Booking domain object
   * @returns Prisma-compatible persistence payload
   */
  static toPersistence(entity: Booking) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      tripInstanceId: entity.tripInstanceId,
      enrollmentDate: entity.enrollmentDate,
      status: entity.status,
      presenceConfirmed: entity.presenceConfirmed,
      enrollmentType: entity.enrollmentType,
      recordedPrice: entity.recordedPrice.toNumber(),
      boardingStop: entity.boardingStop,
      alightingStop: entity.alightingStop,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
