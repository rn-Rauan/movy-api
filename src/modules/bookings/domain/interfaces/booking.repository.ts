import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { Booking } from '../entities';

export abstract class BookingRepository {
  /**
   * Persists a new booking entity.
   * @param entity - Booking to save
   * @returns Booking persisted or null on failure
   */
  abstract save(entity: Booking): Promise<Booking | null>;

  /**
   * Updates an existing booking entity.
   * @param entity - Booking with updated data
   * @returns Booking updated or null on failure
   */
  abstract update(entity: Booking): Promise<Booking | null>;

  /**
   * Deletes a booking by its unique identifier.
   * @param id - UUID of the booking
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Finds a booking by its unique ID.
   * @param id - UUID of the booking
   * @returns Booking or null if not found
   */
  abstract findById(id: string): Promise<Booking | null>;

  /**
   * Lists all bookings with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Lists bookings belonging to a specific organization.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Lists bookings belonging to a specific user.
   * @param userId - UUID of the user
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;

  /**
   * Lists bookings belonging to a specific trip instance.
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Booking list
   */
  abstract findByTripInstanceId(
    tripInstanceId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Booking>>;
}
