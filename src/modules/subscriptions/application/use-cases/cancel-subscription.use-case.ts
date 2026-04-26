import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import {
  SubscriptionForbiddenError,
  SubscriptionNotFoundError,
} from '../../domain/errors/subscription.errors';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

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
