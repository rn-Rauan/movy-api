import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { BookingRepository } from '../../domain/interfaces';

/**
 * Returns a paginated list of bookings for the authenticated user.
 *
 * Accessible to any authenticated user — no org role is required.
 * The `status` filter allows separating active from cancelled bookings.
 */
@Injectable()
export class FindBookingsByUserUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Fetches the user's bookings with optional status filtering.
   *
   * @param userId - UUID of the authenticated user (from JWT)
   * @param options - Pagination parameters `{ page, limit }`
   * @param status - Optional status filter (`ACTIVE` or `INACTIVE`)
   * @returns A {@link PaginatedResponse} containing the requested page of {@link Booking} items
   */
  async execute(userId: string, options: PaginationOptions, status?: Status) {
    return this.bookingRepository.findByUserId(userId, options, status);
  }
}
