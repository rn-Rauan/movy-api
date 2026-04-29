import { Injectable } from '@nestjs/common';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { TripInstanceMapper } from '../mappers/trip-instance.mapper';

/**
 * Prisma-backed implementation of {@link TripInstanceRepository}.
 *
 * All I/O operations target the `tripInstance` table via the Prisma Client.
 */
@Injectable()
export class PrismaTripInstanceRepository implements TripInstanceRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new instance row via `prisma.tripInstance.create`.
   *
   * @param entity - The {@link TripInstance} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.db.tripInstance.create({
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Updates an existing instance row via `prisma.tripInstance.update`.
   *
   * @param entity - The {@link TripInstance} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.db.tripInstance.update({
      where: { id: entity.id },
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Hard-deletes an instance row via `prisma.tripInstance.delete`.
   *
   * @param id - UUID of the trip instance to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.tripInstance.delete({ where: { id } });
  }

  /**
   * Finds an instance by UUID via `prisma.tripInstance.findUnique`.
   *
   * @param id - UUID of the trip instance
   * @returns The matching {@link TripInstance}, or `null` if not found
   */
  async findById(id: string): Promise<TripInstance | null> {
    const data = await this.db.tripInstance.findUnique({
      where: { id },
    });

    if (!data) return null;

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Returns a paginated list of all bookings ordered by `departureTime` ascending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await Promise.all([
      this.db.tripInstance.findMany({
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count(),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of instances for an organisation,
   * ordered by `departureTime` ascending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where: { organizationId },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where: { organizationId } }),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of instances for a specific template,
   * ordered by `departureTime` ascending.
   *
   * @param templateId - UUID of the parent trip template
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findByTemplateId(
    templateId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where: { tripTemplateId: templateId },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where: { tripTemplateId: templateId } }),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Counts trip instances created by an organisation within a date window.
   * Used to enforce `maxMonthlyTrips` from the organisation's active plan.
   *
   * @param organizationId - UUID of the organisation
   * @param start - Window start (inclusive)
   * @param end - Window end (inclusive)
   * @returns Number of trip instances created in the window
   */
  async countByOrganizationAndMonth(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.db.tripInstance.count({
      where: {
        organizationId,
        createdAt: { gte: start, lte: end },
      },
    });
  }
}
