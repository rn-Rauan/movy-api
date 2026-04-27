import type { Subscription as PrismaSubscription } from 'generated/prisma/client';
import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';

/**
 * Bidirectional mapper between the Prisma `Subscription` model and the
 * {@link SubscriptionEntity} domain object.
 *
 * Contains no business logic — only field-level translations between persistence
 * and domain representations.
 */
export class SubscriptionMapper {
  /**
   * Converts a raw Prisma `Subscription` record to a {@link SubscriptionEntity} domain object.
   *
   * @param raw - Raw `Subscription` record returned by the Prisma client
   * @returns A fully hydrated {@link SubscriptionEntity} instance
   */
  static toDomain(raw: PrismaSubscription): SubscriptionEntity {
    return SubscriptionEntity.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      planId: raw.planId,
      status: raw.status as SubscriptionStatus,
      startDate: raw.startDate,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link SubscriptionEntity} to the plain object expected by Prisma's `create` method.
   *
   * The `createdAt` and `updatedAt` fields are excluded because they are managed by the database.
   * This method has an explicit return type to leverage Prisma's type safety.
   *
   * @param entity - The {@link SubscriptionEntity} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.subscription.create({ data })`
   */
  static toPersistence(
    entity: SubscriptionEntity,
  ): Omit<PrismaSubscription, 'createdAt' | 'updatedAt'> {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      planId: entity.planId,
      status: entity.status,
      startDate: entity.startDate,
      expiresAt: entity.expiresAt,
    };
  }
}
