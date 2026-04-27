import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { BookingAccessForbiddenError } from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';

/**
 * Returns a paginated list of all bookings for a specific trip instance.
 *
 * Only org members whose organisation owns the trip instance can list its bookings.
 */
@Injectable()
export class FindBookingsByTripInstanceUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Validates that the trip instance exists and that the caller belongs to the owning organisation,
   * then delegates to the repository.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination parameters `{ page, limit }`
   * @param callerOrganizationId - UUID of the calling user's organisation (from JWT)
   * @returns A {@link PaginatedResponse} of {@link Booking} items
   * @throws {@link TripInstanceNotFoundError} if the trip instance does not exist
   * @throws {@link BookingAccessForbiddenError} if the caller's organisation does not own the instance
   */
  async execute(
    tripInstanceId: string,
    options: PaginationOptions,
    callerOrganizationId?: string,
  ) {
    const instance = await this.tripInstanceRepository.findById(tripInstanceId);

    if (!instance) {
      throw new TripInstanceNotFoundError(tripInstanceId);
    }

    const hasOrgAccess =
      callerOrganizationId != null &&
      instance.organizationId === callerOrganizationId;

    if (!hasOrgAccess) {
      throw new BookingAccessForbiddenError(tripInstanceId);
    }

    return this.bookingRepository.findByTripInstanceId(tripInstanceId, options);
  }
}
