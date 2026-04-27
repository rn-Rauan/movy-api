import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { SubscriptionRepository } from '../../domain/interfaces/subscription.repository';

/**
 * Returns a paginated list of all subscriptions for a given organisation.
 *
 * Includes subscriptions in any status (ACTIVE, CANCELED, PAST_DUE).
 * Restricted to organisation administrators.
 */
@Injectable()
export class FindSubscriptionsByOrganizationUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Delegates pagination to the repository without additional filtering.
   *
   * @param organizationId - UUID of the organisation whose subscriptions to list
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} containing the requested page of {@link SubscriptionEntity} items
   */
  async execute(organizationId: string, options: PaginationOptions) {
    return this.subscriptionRepository.findAllByOrganizationId(
      organizationId,
      options,
    );
  }
}
