import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionRepository } from 'src/modules/subscriptions/domain/interfaces/subscription.repository';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';
import { SubscriptionMapper } from '../mappers/subscription.mapper';

/**
 * Prisma-backed implementation of {@link SubscriptionRepository}.
 *
 * All I/O operations are performed via the Prisma Client targeting PostgreSQL.
 */
@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new subscription row via `prisma.subscription.create`.
   *
   * @param subscription - The {@link SubscriptionEntity} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null> {
    const data = SubscriptionMapper.toPersistence(subscription);
    const result = await this.db.subscription.create({ data });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  /**
   * Patches `status` and `updatedAt` for an existing subscription row.
   *
   * Only these two fields are updated — all other fields are immutable after creation.
   *
   * @param subscription - The {@link SubscriptionEntity} containing the new `status`
   * @returns The updated entity, or `null` if the record no longer exists
   */
  async update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null> {
    const data = SubscriptionMapper.toUpdatePersistence(subscription);
    const result = await this.db.subscription.update({
      where: { id: subscription.id },
      data,
    });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  /**
   * Finds a single subscription by its UUID via `prisma.subscription.findUnique`.
   *
   * @param id - The subscription UUID
   * @returns The matching {@link SubscriptionEntity}, or `null` if not found
   */
  async findById(id: string): Promise<SubscriptionEntity | null> {
    const result = await this.db.subscription.findUnique({ where: { id } });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  /**
   * Returns the most recent subscription matching the given status for an organisation.
   *
   * Uses `findFirst` ordered by `createdAt` descending. Defaults to `ACTIVE` when
   * `status` is not provided.
   *
   * @param organizationId - The organisation UUID
   * @param status - Optional status filter; defaults to `SubscriptionStatus.ACTIVE`
   * @returns The most recent matching {@link SubscriptionEntity}, or `null` if none exists
   */
  async findActiveByOrganizationId(
    organizationId: string,
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
  ): Promise<SubscriptionEntity | null> {
    const result = await this.db.subscription.findFirst({
      where: { organizationId, status },
      orderBy: { createdAt: 'desc' },
    });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  /**
   * Returns a paginated list of all subscriptions for an organisation, ordered by `createdAt` descending.
   *
   * @param organizationId - The organisation UUID
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} with the page of subscription entities and pagination metadata
   */
  async findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<SubscriptionEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.db.subscription.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.subscription.count({ where: { organizationId } }),
    ]);

    return {
      data: subscriptions.map((subscription) =>
        SubscriptionMapper.toDomain(subscription),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
