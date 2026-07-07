import { Injectable } from '@nestjs/common';
import { TripInstance } from 'src/modules/trip/domain/entities';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
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
   * Finds an instance by UUID and joins template fields + active enrollment
   * count in a single query — used by `GET /trip-instances/:id`.
   *
   * @param id - UUID of the trip instance
   * @returns A {@link TripInstanceWithMeta} ready for the presenter, or `null` if not found
   */
  async findByIdWithMeta(id: string): Promise<TripInstanceWithMeta | null> {
    const row = await this.db.tripInstance.findUnique({
      where: { id },
      include: {
        tripTemplate: {
          select: {
            id: true,
            departurePoint: true,
            destination: true,
            stops: true,
            priceOneWay: true,
            priceReturn: true,
            priceRoundTrip: true,
            isRecurring: true,
          },
        },
        _count: {
          select: {
            enrollments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!row) return null;

    return TripInstanceMapper.toDomainWithMeta(row);
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
   * Returns a paginated list of instances for an organisation enriched with
   * booking occupancy counts and denormalised template fields — all in a single query.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstanceWithMeta} items
   */
  async findByOrganizationIdWithMeta(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where: { organizationId },
        include: {
          tripTemplate: {
            select: {
              id: true,
              departurePoint: true,
              destination: true,
              stops: true,
              priceOneWay: true,
              priceReturn: true,
              priceRoundTrip: true,
              isRecurring: true,
            },
          },
          _count: {
            select: {
              enrollments: { where: { status: 'ACTIVE' } },
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where: { organizationId } }),
    ]);

    const data = rows.map((row) => TripInstanceMapper.toDomainWithMeta(row));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Returns a paginated list of instances assigned to a driver **within a
   * specific organisation**, enriched with template fields + active enrollment
   * count. Optional `status` filter. The `organizationId` predicate prevents
   * cross-tenant leaks for drivers holding memberships in multiple orgs.
   */
  async findByDriverIdWithMeta(
    driverId: string,
    organizationId: string,
    options: PaginationOptions,
    status?: TripStatus,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = {
      driverId,
      organizationId,
      ...(status ? { tripStatus: status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where,
        include: {
          tripTemplate: {
            select: {
              id: true,
              departurePoint: true,
              destination: true,
              stops: true,
              priceOneWay: true,
              priceReturn: true,
              priceRoundTrip: true,
              isRecurring: true,
            },
          },
          _count: {
            select: {
              enrollments: { where: { status: 'ACTIVE' } },
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where }),
    ]);

    const data = rows.map((row) => TripInstanceMapper.toDomainWithMeta(row));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
   * Counts the organisation's trip instances **created** within the current
   * subscription term `[start, end)`, excluding `DRAFT` instances. Used both for
   * the plan-usage display and to enforce `maxMonthlyTrips` from the active plan.
   *
   * Every trip that reached a real lifecycle state (SCHEDULED, CONFIRMED,
   * IN_PROGRESS, FINISHED, CANCELED) counts toward the quota — a trip is not
   * "given back" by cancelling it. Only DRAFT instances, which were never
   * committed, are excluded.
   *
   * @param organizationId - UUID of the organisation
   * @param start - Term start, inclusive (`subscription.startDate`)
   * @param end - Term end, exclusive (`subscription.expiresAt`)
   * @returns Number of non-draft trip instances created in the term
   */
  async countByOrganizationInPeriod(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.db.tripInstance.count({
      where: {
        organizationId,
        createdAt: { gte: start, lt: end },
        tripStatus: { not: 'DRAFT' },
      },
    });
  }

  /**
   * Returns expired-but-open instances for the auto-cancel cron job.
   * Uses the `autoCancelAt` index for the time predicate.
   */
  async findExpiredOpenInstances(
    organizationId: string,
    threshold: Date,
  ): Promise<TripInstance[]> {
    const rows = await this.db.tripInstance.findMany({
      where: {
        organizationId,
        autoCancelAt: { lte: threshold, not: null },
        tripStatus: { in: ['DRAFT', 'SCHEDULED', 'CONFIRMED'] },
        forceConfirm: false,
      },
    });
    return rows.map((row) => TripInstanceMapper.toDomain(row));
  }

  async findStaleOpenInstances(
    organizationId: string,
    threshold: Date,
  ): Promise<TripInstance[]> {
    const rows = await this.db.tripInstance.findMany({
      where: {
        organizationId,
        departureTime: { lte: threshold },
        tripStatus: { in: ['DRAFT', 'SCHEDULED', 'CONFIRMED'] },
        forceConfirm: false,
      },
    });
    return rows.map((row) => TripInstanceMapper.toDomain(row));
  }

  /**
   * Idempotency check for the recurring-generation cron: returns `true` if any
   * TripInstance already exists for the given template within the UTC day window.
   * Uses the `(tripTemplateId, departureTime)` composite index.
   */
  async existsForTemplateOnDay(
    templateId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<boolean> {
    const count = await this.db.tripInstance.count({
      where: {
        tripTemplateId: templateId,
        departureTime: { gte: dayStart, lte: dayEnd },
      },
    });
    return count > 0;
  }
}
