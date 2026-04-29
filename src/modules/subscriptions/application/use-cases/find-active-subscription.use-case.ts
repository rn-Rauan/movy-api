import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { resolveActiveSubscription } from '../utils/resolve-active-subscription';

/**
 * Returns the currently active subscription for a given organisation, if any.
 *
 * Lazily expires subscriptions whose `expiresAt` has passed: transitions them
 * to PAST_DUE and persists the change before returning `null`.
 *
 * Returns `null` instead of throwing when no active subscription is found,
 * allowing callers to handle the absence gracefully.
 */
@Injectable()
export class FindActiveSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Queries for the active subscription and expires it if overdue.
   *
   * @param organizationId - UUID of the organisation to query
   * @returns The active {@link SubscriptionEntity}, or `null` if none or expired
   */
  async execute(organizationId: string) {
    return resolveActiveSubscription(
      organizationId,
      this.subscriptionRepository,
    );
  }
}
