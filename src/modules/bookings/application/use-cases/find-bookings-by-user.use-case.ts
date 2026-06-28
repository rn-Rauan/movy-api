import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { BookingRepository } from '../../domain/interfaces';

/**
 * Returns a paginated list of bookings for the authenticated user, each enriched
 * with the parent trip instance's lifecycle status and departure time.
 *
 * Accessible to any authenticated user — no org role is required.
 * The `status` filter allows separating active from cancelled bookings.
 */
@Injectable()
export class FindBookingsByUserUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Fetches the user's bookings (with trip status/departure) and optional status filtering.
   *
   * @param userId - UUID of the authenticated user (from JWT)
   * @param options - Pagination parameters `{ page, limit }`
   * @param status - Optional status filter (`ACTIVE` or `INACTIVE`)
   * @returns A {@link PaginatedResponse} of {@link BookingWithTripMeta} items for the requested page
   */
  async execute(userId: string, options: PaginationOptions, status?: Status) {
    return this.bookingRepository.findByUserIdWithTrip(userId, options, status);
  }
}
