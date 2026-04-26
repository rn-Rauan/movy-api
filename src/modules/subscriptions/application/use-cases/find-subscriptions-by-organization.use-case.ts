import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';

@Injectable()
export class FindSubscriptionsByOrganizationUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(organizationId: string, options: PaginationOptions) {
    return this.subscriptionRepository.findAllByOrganizationId(
      organizationId,
      options,
    );
  }
}
