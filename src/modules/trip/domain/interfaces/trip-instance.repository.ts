import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripInstance } from '../entities';
import { TripStatus } from './enums/trip-status.enum';

/**
 * Enriched data bag returned by {@link TripInstanceRepository.findByOrganizationIdWithMeta}.
 *
 * Combines the core {@link TripInstance} entity with booking occupancy counts and
 * denormalised fields from the parent `TripTemplate` — all resolved in a single SQL query
 * (no N+1).
 */
export interface TripInstanceWithMeta {
  instance: TripInstance;
  bookedCount: number;
  templateId: string;
  departurePoint: string;
  destination: string;
  stops: string[];
  priceOneWay: number | null;
  priceReturn: number | null;
  priceRoundTrip: number | null;
  isRecurring: boolean;
}

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
   * Finds a trip instance by its UUID and joins it with the parent template
   * (id, departurePoint, destination, stops, prices, isRecurring) plus the
   * active enrollment count — all in a single query.
   *
   * @param id - UUID of the trip instance
   * @returns The matching {@link TripInstanceWithMeta}, or `null` if not found
   */
  abstract findByIdWithMeta(id: string): Promise<TripInstanceWithMeta | null>;

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
   * Returns a paginated list of trip instances for an organisation enriched with
   * booking occupancy counts and denormalised template fields — all in a single query.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstanceWithMeta} items
   */
  abstract findByOrganizationIdWithMeta(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>>;

  /**
   * Returns a paginated list of trip instances assigned to a specific driver
   * **within a specific organisation**, enriched with booking occupancy counts
   * and denormalised template fields. Optionally filtered by lifecycle status.
   * Ordered by `departureTime` ascending.
   *
   * The `organizationId` filter is required to enforce multi-tenant isolation:
   * a `Driver` entity is 1:1 with a `User` (see schema: `Driver.userId @unique`),
   * but the same user may hold DRIVER memberships in multiple organisations.
   * Without this scope, calling `/trip-instances/driver/me` would leak trips
   * across tenants.
   *
   * @param driverId - UUID of the driver
   * @param organizationId - UUID of the organisation the caller's JWT is scoped to
   * @param options - Pagination parameters `{ page, limit }`
   * @param status - Optional {@link TripStatus} filter
   * @returns A {@link PaginatedResponse} of {@link TripInstanceWithMeta} items
   */
  abstract findByDriverIdWithMeta(
    driverId: string,
    organizationId: string,
    options: PaginationOptions,
    status?: TripStatus,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>>;

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
   * Used for `maxMonthlyTrips` enforcement — pass the current billing-period
   * window (`expiresAt − plan.durationDays` … now).
   *
   * @param organizationId - UUID of the organisation
   * @param start - Start of the window (inclusive)
   * @param end - End of the window (inclusive)
   * @returns Number of trip instances created in the window
   */
  abstract countByOrganizationInPeriod(
    organizationId: string,
    start: Date,
    end: Date,
  ): Promise<number>;

  /**
   * Returns instances for an organisation whose `autoCancelAt <= threshold`
   * and whose `tripStatus` is still cancellable (DRAFT / SCHEDULED / CONFIRMED),
   * excluding rows with `forceConfirm = true`.
   *
   * Used by the auto-cancel cron job. Unpaginated by design: the query is
   * tightly bounded (autoCancelAt is indexed; results in a 15-minute window
   * are small) and the caller iterates results in-memory.
   *
   * @param organizationId - UUID of the organisation
   * @param threshold - Cut-off instant; instances with `autoCancelAt <= threshold` are returned
   * @returns Array of expired-but-open {@link TripInstance} items
   */
  abstract findExpiredOpenInstances(
    organizationId: string,
    threshold: Date,
  ): Promise<TripInstance[]>;

  /**
   * Checks whether a TripInstance already exists for the given template + departure
   * date (UTC day window). Used by the recurring-generation cron to keep generation
   * idempotent — if a row exists for that (template, day) pair, the cron skips it.
   *
   * @param templateId - UUID of the parent {@link TripTemplate}
   * @param dayStart - 00:00:00.000 UTC of the target departure day (inclusive)
   * @param dayEnd - 23:59:59.999 UTC of the target departure day (inclusive)
   * @returns `true` if any instance already falls within the day, `false` otherwise
   */
  abstract existsForTemplateOnDay(
    templateId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<boolean>;
}
