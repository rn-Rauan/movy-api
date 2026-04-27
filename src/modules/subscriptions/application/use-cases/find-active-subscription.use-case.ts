import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { SubscriptionStatus } from '../../domain/interfaces/enums/subscription-status.enum';

/**
 * Returns the currently active subscription for a given organisation, if any.
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
   * Queries the repository for the most recent ACTIVE subscription of the organisation.
   *
   * @param organizationId - UUID of the organisation to query
   * @returns The active {@link SubscriptionEntity}, or `null` if none exists
   */
  async execute(organizationId: string) {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
        SubscriptionStatus.ACTIVE,
      );

    return subscription;
  }
}
