import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';

/**
 * Fetches the active subscription for an organisation and lazily expires it
 * if `expiresAt` has passed (ACTIVE → PAST_DUE, persisted immediately).
 *
 * This pattern avoids the need for a background cron job while still ensuring
 * expired subscriptions are never treated as valid.
 *
 * @returns The active {@link SubscriptionEntity}, or `null` if none or if expired.
 */
export async function resolveActiveSubscription(
  organizationId: string,
  subscriptionRepository: SubscriptionRepository,
): Promise<SubscriptionEntity | null> {
  const subscription =
    await subscriptionRepository.findActiveByOrganizationId(organizationId);

  if (!subscription) return null;

  if (subscription.isExpired) {
    subscription.expire();
    await subscriptionRepository.update(subscription);
    return null;
  }

  return subscription;
}
