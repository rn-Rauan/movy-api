import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';

type SubscriptionOverrides = Partial<{
  id: string;
  organizationId: string;
  planId: number;
  status: SubscriptionStatus;
  expiresAt: Date;
}>;

export function makeSubscription(overrides: SubscriptionOverrides = {}): SubscriptionEntity {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return SubscriptionEntity.restore({
    id: overrides.id ?? 'subscription-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    planId: overrides.planId ?? 1,
    status: overrides.status ?? SubscriptionStatus.ACTIVE,
    startDate: now,
    expiresAt: overrides.expiresAt ?? expiresAt,
    createdAt: now,
    updatedAt: now,
  });
}
