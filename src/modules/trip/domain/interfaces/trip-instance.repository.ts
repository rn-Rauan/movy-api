import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripInstance } from '../entities';

/**
 * Repository contract for {@link TripInstance}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-trip-instance.repository.ts`.
 * Registered in the NestJS DI container as an abstract class token.
 * Exported from {@link TripModule} so that {@link BookingsModule} can consume it.
 */
export abstract class TripInstanceRepository {
  /**
   * Persists a new trip instance entity.
   *
   * @param entity - The {@link TripInstance} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(entity: TripInstance): Promise<TripInstance | null>;

  /**
   * Updates an existing trip instance entity.
   *
   * @param entity - The {@link TripInstance} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(entity: TripInstance): Promise<TripInstance | null>;

  /**
   * Hard-deletes a trip instance row by its UUID.
   *
   * @param id - UUID of the trip instance to delete
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Finds a trip instance by its UUID primary key.
   *
   * @param id - UUID of the trip instance
   * @returns The matching {@link TripInstance}, or `null` if not found
   */
  abstract findById(id: string): Promise<TripInstance | null>;

  /**
   * Returns a paginated list of all trip instances, ordered by `departureTime` ascending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;

  /**
   * Returns a paginated list of trip instances for an organisation,
   * ordered by `departureTime` ascending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;

  /**
   * Returns a paginated list of trip instances derived from a specific template,
   * ordered by `departureTime` ascending.
   *
   * @param templateId - UUID of the parent trip template
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  abstract findByTemplateId(
    templateId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;

  /**
   * Counts trip instances created by an organisation within a date range.
   * Used for `maxMonthlyTrips` enforcement — pass the first and last instant
   * of the current calendar month.
   *
   * @param organizationId - UUID of the organisation
   * @param start - Start of the window (inclusive)
   * @param end - End of the window (inclusive)
   * @returns Number of trip instances created in the window
   */
  abstract countByOrganizationAndMonth(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number>;
}
