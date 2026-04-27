import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { Booking } from '../entities';

/**
 * Repository contract for {@link Booking}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-booking.repository.ts`.
 * This abstract class is registered in the NestJS DI container as a token so that
 * use cases depend only on the interface, not on the Prisma client.
 */
export abstract class BookingRepository {
  /**
   * Persists a new booking entity.
   *
   * @param entity - The {@link Booking} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(entity: Booking): Promise<Booking | null>;

  /**
   * Updates an existing booking entity.
   *
   * @param entity - The {@link Booking} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(entity: Booking): Promise<Booking | null>;

  /**
   * Hard-deletes a booking row by its UUID.
   *
   * @param id - UUID of the booking to delete
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Finds a booking by its UUID primary key.
   *
   * @param id - UUID of the booking
   * @returns The matching {@link Booking}, or `null` if not found
   */
  abstract findById(id: string): Promise<Booking | null>;

  /**
   * Returns a paginated list of all bookings, ordered by `enrollmentDate` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Returns a paginated list of bookings belonging to a specific organisation.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Returns a paginated list of bookings belonging to a specific user.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @param status - Optional status filter (`ACTIVE` or `INACTIVE`)
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
    status?: Status,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Returns a paginated list of bookings for a specific trip instance.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   */
  abstract findByTripInstanceId(
    tripInstanceId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Looks up a single booking for a user-and-trip-instance combination.
   *
   * Used to enforce the duplicate-booking invariant before persisting.
   *
   * @param userId - UUID of the user
   * @param tripInstanceId - UUID of the trip instance
   * @returns The existing {@link Booking} if found, or `null`
   */
  abstract findByUserAndTripInstance(
    userId: string,
    tripInstanceId: string,
  ): Promise<Booking | null>;

  /**
   * Counts the number of `ACTIVE` bookings for a trip instance.
   *
   * Used to enforce vehicle capacity limits before creating a new booking.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @returns The number of currently active bookings
   */
  abstract countActiveByTripInstance(tripInstanceId: string): Promise<number>;
}
