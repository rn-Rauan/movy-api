import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';

export abstract class SubscriptionRepository {
  abstract save(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null>;
  abstract update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null>;
  abstract findById(id: string): Promise<SubscriptionEntity | null>;
  abstract findActiveByOrganizationId(
    organizationId: string,
    status?: SubscriptionStatus,
  ): Promise<SubscriptionEntity | null>;
  abstract findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<SubscriptionEntity>>;
}
