import { Injectable } from '@nestjs/common';
import { Booking } from 'src/modules/bookings/domain/entities';
import { BookingRepository } from 'src/modules/bookings/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { BookingMapper } from '../mappers/booking.mapper';

@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists a new booking entity.
   * @param entity - Booking to save
   * @returns Booking persisted or null
   */
  async save(entity: Booking): Promise<Booking | null> {
    const data = await this.prisma.enrollment.create({
      data: BookingMapper.toPersistence(entity),
    });

    return BookingMapper.toDomain(data);
  }

  /**
   * Updates an existing booking entity.
   * @param entity - Booking with updated data
   * @returns Booking updated or null
   */
  async update(entity: Booking): Promise<Booking | null> {
    const data = await this.prisma.enrollment.update({
      where: { id: entity.id },
      data: BookingMapper.toPersistence(entity),
    });

    return BookingMapper.toDomain(data);
  }

  /**
   * Deletes a booking by its unique identifier.
   * @param id - UUID of the booking to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.enrollment.delete({ where: { id } });
  }

  /**
   * Finds a booking by its unique ID.
   * @param id - UUID of the booking
   * @returns Booking or null if not found
   */
  async findById(id: string): Promise<Booking | null> {
    const data = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!data) return null;

    return BookingMapper.toDomain(data);
  }

  /**
   * Lists all bookings with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        orderBy: { enrollmentDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count(),
    ]);

    return {
      data: bookings.map((b) => BookingMapper.toDomain(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lists bookings belonging to a specific organization, ordered by enrollment date.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: { organizationId },
        orderBy: { enrollmentDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where: { organizationId } }),
    ]);

    return {
      data: bookings.map((b) => BookingMapper.toDomain(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lists bookings belonging to a specific user, ordered by enrollment date.
   * @param userId - UUID of the user
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  async findByUserId(
    userId: string,
    options: PaginationOptions,
    status?: Status,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = status ? { userId, status } : { userId };

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: { enrollmentDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data: bookings.map((b) => BookingMapper.toDomain(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lists bookings belonging to a specific trip instance, ordered by enrollment date.
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  async findByTripInstanceId(
    tripInstanceId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: { tripInstanceId },
        orderBy: { enrollmentDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where: { tripInstanceId } }),
    ]);

    return {
      data: bookings.map((b) => BookingMapper.toDomain(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds a single booking for a specific user and trip instance combination.
   * @param userId - UUID of the user
   * @param tripInstanceId - UUID of the trip instance
   * @returns Booking if found, or null
   */
  async findByUserAndTripInstance(
    userId: string,
    tripInstanceId: string,
  ): Promise<Booking | null> {
    const data = await this.prisma.enrollment.findFirst({
      where: { userId, tripInstanceId, status: 'ACTIVE' },
    });

    if (!data) return null;

    return BookingMapper.toDomain(data);
  }

  /**
   * Counts active bookings for a specific trip instance.
   * Used to enforce vehicle capacity limits.
   * @param tripInstanceId - UUID of the trip instance
   * @returns Number of active bookings
   */
  async countActiveByTripInstance(tripInstanceId: string): Promise<number> {
    return this.prisma.enrollment.count({
      where: { tripInstanceId, status: 'ACTIVE' },
    });
  }
}
