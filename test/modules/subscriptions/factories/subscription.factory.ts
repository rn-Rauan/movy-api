import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';

type SubscriptionOverrides = Partial<{
  id: string;
  organizationId: string;
  planId: number;
  status: SubscriptionStatus;
  startDate: Date;
  expiresAt: Date;
}>;

export function makeSubscription(
  overrides: SubscriptionOverrides = {},
): SubscriptionEntity {
  const now = new Date();
  const startDate = overrides.startDate ?? now;
  const expiresAt = new Date(startDate);
  expiresAt.setDate(expiresAt.getDate() + 30);

  return SubscriptionEntity.restore({
    id: overrides.id ?? 'subscription-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    planId: overrides.planId ?? 1,
    status: overrides.status ?? SubscriptionStatus.ACTIVE,
    startDate,
    expiresAt: overrides.expiresAt ?? expiresAt,
    createdAt: startDate,
    updatedAt: startDate,
  });
}
