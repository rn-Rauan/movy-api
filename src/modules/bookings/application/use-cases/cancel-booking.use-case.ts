import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class CancelBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Cancels a booking by setting its status to INACTIVE.
   * @param id - UUID of the booking to cancel
   * @param organizationId - UUID of the organization from JWT context
   * @returns BookingResponseDto of the cancelled booking
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if the booking belongs to a different organization
   */
  async execute(
    id: string,
    organizationId: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    if (booking.organizationId !== organizationId) {
      throw new BookingAccessForbiddenError(id);
    }

    booking.cancel();

    const updated = await this.bookingRepository.update(booking);

    if (!updated) {
      throw new BookingNotFoundError(id);
    }

    return BookingPresenter.toHTTP(updated);
  }
}
