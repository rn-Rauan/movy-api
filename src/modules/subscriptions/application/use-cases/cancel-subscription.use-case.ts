import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import {
  SubscriptionForbiddenError,
  SubscriptionNotFoundError,
} from '../../domain/errors/subscription.errors';

/**
 * Cancels an existing subscription on behalf of an organisation administrator.
 *
 * Enforces tenant isolation by verifying that the subscription belongs to the
 * requesting organisation before mutating it.
 */
@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Looks up the subscription, validates ownership, calls `cancel()`, and persists.
   *
   * @param id - UUID of the subscription to cancel
   * @param organizationId - UUID of the requesting organisation (tenant check)
   * @returns The cancelled {@link SubscriptionEntity} with `status = CANCELED`
   * @throws {@link SubscriptionNotFoundError} if no subscription with the given `id` exists
   * @throws {@link SubscriptionForbiddenError} if the subscription belongs to a different organisation
   * @throws {@link SubscriptionNotFoundError} if the update fails (record disappeared concurrently)
   */
  async execute(id: string, organizationId: string) {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new SubscriptionNotFoundError(id);
    }

    if (subscription.organizationId !== organizationId) {
      throw new SubscriptionForbiddenError(id);
    }

    subscription.cancel();

    const updated = await this.subscriptionRepository.update(subscription);
    if (!updated) {
      throw new SubscriptionNotFoundError(id);
    }

    return updated;
  }
}
