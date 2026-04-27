import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionStatus } from './enums/subscription-status.enum';

/**
 * Repository contract for {@link SubscriptionEntity}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-subscription.repository.ts`.
 * This abstract class is registered in the NestJS DI container as a token so that
 * use cases depend only on the interface, not on the Prisma client.
 */
export abstract class SubscriptionRepository {
  /**
   * Persists a new subscription record in the database.
   *
   * @param subscription - The {@link SubscriptionEntity} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null>;

  /**
   * Updates an existing subscription record.
   *
   * Only `status` and `updatedAt` are patched — other fields are immutable after creation.
   *
   * @param subscription - The {@link SubscriptionEntity} containing the updated state
   * @returns The updated entity, or `null` if the record no longer exists
   */
  abstract update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null>;

  /**
   * Finds a subscription by its UUID primary key.
   *
   * @param id - The subscription UUID
   * @returns The matching {@link SubscriptionEntity}, or `null` if not found
   */
  abstract findById(id: string): Promise<SubscriptionEntity | null>;

  /**
   * Returns the most recent subscription for an organisation filtered by status.
   *
   * Defaults to `ACTIVE` status when `status` is omitted.
   * Uses `findFirst` ordered by `createdAt` descending.
   *
   * @param organizationId - The organisation UUID
   * @param status - Optional status filter (defaults to `ACTIVE`)
   * @returns The most recent matching {@link SubscriptionEntity}, or `null` if none exists
   */
  abstract findActiveByOrganizationId(
    organizationId: string,
    status?: SubscriptionStatus,
  ): Promise<SubscriptionEntity | null>;

  /**
   * Returns a paginated list of all subscriptions for an organisation.
   *
   * @param organizationId - The organisation UUID
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link SubscriptionEntity} items
   */
  abstract findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<SubscriptionEntity>>;
}
