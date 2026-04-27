import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { BookingRepository } from '../../domain/interfaces';

/**
 * Returns a paginated list of all bookings belonging to an organisation.
 *
 * Restricted to organisation administrators via `RolesGuard` + `TenantFilterGuard`.
 */
@Injectable()
export class FindBookingsByOrganizationUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Delegates to the repository for a paginated result, ordered by `enrollmentDate` descending.
   *
   * @param organizationId - UUID of the organisation whose bookings to list
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} containing the requested page of {@link Booking} items
   */
  async execute(organizationId: string, options: PaginationOptions) {
    return this.bookingRepository.findByOrganizationId(organizationId, options);
  }
}
