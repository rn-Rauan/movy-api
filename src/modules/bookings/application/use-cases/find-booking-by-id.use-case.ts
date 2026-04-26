import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { Booking } from '../../domain/entities';

@Injectable()
export class FindBookingByIdUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Finds a booking by its unique ID, scoped to the requesting organization.
   * @param id - UUID of the booking
   * @param organizationId - UUID of the organization from JWT context
   * @returns BookingResponseDto found
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if the booking belongs to a different organization
   */
  /**
   * Finds a booking by ID. Org members or the booking owner can access it.
   * @param id - UUID of the booking
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organization (from JWT, optional for B2C users)
   * @returns BookingResponseDto found
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if caller is not the owner and not from the same org
   */
  async execute(
    id: string,
    userId: string,
    organizationId?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    const hasOrgAccess =
      organizationId != null && booking.organizationId === organizationId;
    const isOwner = booking.userId === userId;

    if (!hasOrgAccess && !isOwner) {
      throw new BookingAccessForbiddenError(id);
    }

    return booking;
  }
}
