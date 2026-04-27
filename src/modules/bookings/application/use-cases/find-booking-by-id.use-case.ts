import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { Booking } from '../../domain/entities';

/**
 * Retrieves a single booking by its UUID.
 *
 * Access control: the booking owner **or** an org member with matching
 * `organizationId` can access the booking.
 */
@Injectable()
export class FindBookingByIdUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Looks up the booking and enforces access control.
   *
   * @param id - UUID of the booking
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organisation (from JWT; optional for B2C users)
   * @returns The matching {@link Booking}
   * @throws {@link BookingNotFoundError} if no booking with the given `id` exists
   * @throws {@link BookingAccessForbiddenError} if the caller is neither the owner nor an org member
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
