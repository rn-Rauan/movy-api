import { Enrollment as PrismaEnrollment } from 'generated/prisma/client';
import { Booking } from 'src/modules/bookings/domain/entities';
import { EnrollmentType } from 'src/modules/bookings/domain/interfaces';
import { Money } from 'src/shared';
import type { Status } from 'src/shared/domain/types';

/**
 * Bidirectional mapper between the Prisma `Enrollment` model and the {@link Booking} domain object.
 *
 * Handles the `recordedPrice` field by casting `Prisma.Decimal` to `number` via `Number()`
 * and reconstructing the {@link Money} Value Object. Contains no business logic.
 */
export class BookingMapper {
  /**
   * Converts a raw Prisma `Enrollment` record to a {@link Booking} domain object.
   *
   * Casts `recordedPrice` from `Prisma.Decimal` to `number` via `Number()` and
   * reconstructs the {@link Money} Value Object from that value.
   *
   * @param raw - Raw `Enrollment` record returned by the Prisma client
   * @returns A fully hydrated {@link Booking} instance
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
   * Converts a {@link Booking} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * The return type is intentionally left untyped to avoid an explicit `Prisma.Decimal` cast;
   * passing a plain `number` to `recordedPrice` is accepted by the Prisma client at runtime.
   *
   * @param entity - The {@link Booking} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.enrollment.create({ data })`
   */
  static toPersistence(entity: Booking) {
    const activeKey =
      entity.status === 'ACTIVE'
        ? `${entity.userId}:${entity.tripInstanceId}`
        : null;

    return {
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      tripInstanceId: entity.tripInstanceId,
      enrollmentDate: entity.enrollmentDate,
      status: entity.status,
      activeKey,
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
