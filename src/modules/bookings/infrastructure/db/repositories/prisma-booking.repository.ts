import { Injectable } from '@nestjs/common';
import { Booking } from 'src/modules/bookings/domain/entities';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { BookingMapper } from '../mappers/booking.mapper';

const PAYMENT_INCLUDE = {
  payment: { select: { method: true } },
} as const;

/**
 * Prisma-backed implementation of {@link BookingRepository}.
 *
 * All I/O operations target the `enrollment` table via the Prisma Client.
 */
@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the transaction-scoped client when inside a transaction, or the root PrismaService. */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new booking row via `prisma.enrollment.create`.
   *
   * @param entity - The {@link Booking} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(entity: Booking): Promise<Booking | null> {
    const data = await this.db.enrollment.create({
      data: BookingMapper.toPersistence(entity),
    });

    return BookingMapper.toDomain(data);
  }

  /**
   * Updates an existing booking row via `prisma.enrollment.update`.
   *
   * @param entity - The {@link Booking} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(entity: Booking): Promise<Booking | null> {
    const data = await this.db.enrollment.update({
      where: { id: entity.id },
      data: BookingMapper.toPersistence(entity),
    });

    return BookingMapper.toDomain(data);
  }

  /**
   * Hard-deletes a booking row via `prisma.enrollment.delete`.
   *
   * @param id - UUID of the booking to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.enrollment.delete({ where: { id } });
  }

  /**
   * Finds a single booking by UUID via `prisma.enrollment.findUnique`.
   *
   * @param id - UUID of the booking
   * @returns The matching {@link Booking}, or `null` if not found
   */
  async findById(id: string): Promise<Booking | null> {
    const row = await this.db.enrollment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!row) return null;

    return BookingMapper.toDomainFromRow(row);
  }

  /**
   * Returns a paginated list of all bookings ordered by `enrollmentDate` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.db.enrollment.findMany({
        orderBy: { enrollmentDate: 'desc' },
        include: PAYMENT_INCLUDE,
        skip,
        take: limit,
      }),
      this.db.enrollment.count(),
    ]);

    return {
      data: bookings.map((row) => BookingMapper.toDomainFromRow(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of bookings for an organisation, ordered by `enrollmentDate` descending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.db.enrollment.findMany({
        where: { organizationId },
        orderBy: { enrollmentDate: 'desc' },
        include: PAYMENT_INCLUDE,
        skip,
        take: limit,
      }),
      this.db.enrollment.count({ where: { organizationId } }),
    ]);

    return {
      data: bookings.map((row) => BookingMapper.toDomainFromRow(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of bookings for a user, ordered by `enrollmentDate` descending.
   *
   * Accepts an optional `status` filter; if omitted, returns all statuses.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @param status - Optional status filter (`ACTIVE` or `INACTIVE`)
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  async findByUserId(
    userId: string,
    options: PaginationOptions,
    status?: Status,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = status ? { userId, status } : { userId };

    const [bookings, total] = await Promise.all([
      this.db.enrollment.findMany({
        where,
        orderBy: { enrollmentDate: 'desc' },
        include: PAYMENT_INCLUDE,
        skip,
        take: limit,
      }),
      this.db.enrollment.count({ where }),
    ]);

    return {
      data: bookings.map((row) => BookingMapper.toDomainFromRow(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of bookings for a trip instance, ordered by `enrollmentDate` descending.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  async findByTripInstanceId(
    tripInstanceId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.db.enrollment.findMany({
        where: { tripInstanceId },
        orderBy: { enrollmentDate: 'desc' },
        include: PAYMENT_INCLUDE,
        skip,
        take: limit,
      }),
      this.db.enrollment.count({ where: { tripInstanceId } }),
    ]);

    return {
      data: bookings.map((row) => BookingMapper.toDomainFromRow(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds a single booking for the given user-and-trip-instance combination.
   *
   * Used to enforce the duplicate-booking invariant.
   *
   * @param userId - UUID of the user
   * @param tripInstanceId - UUID of the trip instance
   * @returns The existing {@link Booking} if found, or `null`
   */
  async findByUserAndTripInstance(
    userId: string,
    tripInstanceId: string,
  ): Promise<Booking | null> {
    const row = await this.db.enrollment.findFirst({
      where: { userId, tripInstanceId, status: 'ACTIVE' },
      include: PAYMENT_INCLUDE,
    });

    if (!row) return null;

    return BookingMapper.toDomainFromRow(row);
  }

  /**
   * Counts active bookings for a specific trip instance.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @returns The number of active bookings
   */
  async countActiveByTripInstance(tripInstanceId: string): Promise<number> {
    return this.db.enrollment.count({
      where: { tripInstanceId, status: 'ACTIVE' },
    });
  }

  /**
   * Returns a name + boarding-stop projection for all `ACTIVE` passengers of a trip instance.
   *
   * Uses a Prisma `select` with a user join — bypasses {@link BookingMapper} since no full
   * domain entity is needed. Results are ordered by `boardingStop` ascending.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @returns Array of `{ name, boardingStop }` for every active booking on the trip
   */
  async findActivePassengersByTripInstanceId(
    tripInstanceId: string,
  ): Promise<Array<{ userId: string; name: string; boardingStop: string }>> {
    const rows = await this.db.enrollment.findMany({
      where: { tripInstanceId, status: 'ACTIVE' },
      select: {
        userId: true,
        boardingStop: true,
        user: { select: { name: true } },
      },
      orderBy: { boardingStop: 'asc' },
    });

    return rows.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      boardingStop: r.boardingStop,
    }));
  }
}
