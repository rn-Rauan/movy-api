import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingAlreadyInactiveError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class ConfirmPresenceUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Confirms the passenger's physical presence for a booking.
   * Only org members (Admin/Driver) can confirm presence — the passenger cannot confirm themselves.
   * Confirmation is blocked if the booking is already INACTIVE.
   * @param id - UUID of the booking
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organization (from JWT, required for presence confirmation)
   * @returns BookingResponseDto with presenceConfirmed = true
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if caller is not from the same org as the booking
   * @throws BookingAlreadyInactiveError if booking is already inactive/canceled
   */
  async execute(
    id: string,
    userId: string,
    organizationId?: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    if (booking.status === 'INACTIVE') {
      throw new BookingAlreadyInactiveError(id);
    }

    const hasOrgAccess =
      organizationId != null && booking.organizationId === organizationId;

    if (!hasOrgAccess) {
      throw new BookingAccessForbiddenError(id);
    }

    booking.confirmPresence();

    const updated = await this.bookingRepository.update(booking);

    if (!updated) {
      throw new BookingNotFoundError(id);
    }

    return BookingPresenter.toHTTP(updated);
  }
}
