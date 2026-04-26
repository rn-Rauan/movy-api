import type { Subscription as PrismaSubscription } from 'generated/prisma/client';
import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';

export class SubscriptionMapper {
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
