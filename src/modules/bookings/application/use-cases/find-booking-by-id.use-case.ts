import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

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

    return BookingPresenter.toHTTP(booking);
  }
}
