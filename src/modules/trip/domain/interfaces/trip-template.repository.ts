import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripTemplate } from '../entities';

/**
 * Repository contract for {@link TripTemplate}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-trip-template.repository.ts`.
 * Registered in the NestJS DI container as an abstract class token.
 */
export abstract class TripTemplateRepository {
  /**
   * Persists a new trip template entity.
   *
   * @param tripTemplate - The {@link TripTemplate} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(tripTemplate: TripTemplate): Promise<TripTemplate | null>;

  /**
   * Finds a trip template by its UUID primary key.
   *
   * @param id - UUID of the trip template
   * @returns The matching {@link TripTemplate}, or `null` if not found
   */
  abstract findById(id: string): Promise<TripTemplate | null>;

  /**
   * Returns a paginated list of all templates (any status) for an organisation,
   * ordered by `createdAt` descending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripTemplate} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>>;

  /**
   * Returns a paginated list of `ACTIVE`-only templates for an organisation,
   * ordered by `createdAt` descending.
   *
   * Used when creating a {@link TripInstance} to ensure the template can still
   * produce new executions.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link TripTemplate} items
   */
  abstract findActiveByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>>;

  /**
   * Updates an existing trip template entity.
   *
   * @param tripTemplate - The {@link TripTemplate} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(tripTemplate: TripTemplate): Promise<TripTemplate | null>;

  /**
   * Hard-deletes a trip template row by its UUID.
   *
   * @param id - UUID of the trip template to delete
   */
  abstract delete(id: string): Promise<void>;
}
