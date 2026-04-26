import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';
import { SubscriptionStatus } from '../../domain/interfaces/enums/subscription-status.enum';

@Injectable()
export class FindActiveSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(organizationId: string) {
    const subscription =
      await this.subscriptionRepository.findActiveByOrganizationId(
        organizationId,
        SubscriptionStatus.ACTIVE,
      );

    return subscription;
  }
}
