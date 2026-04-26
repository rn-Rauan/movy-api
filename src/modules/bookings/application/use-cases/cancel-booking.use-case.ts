import { Injectable } from '@nestjs/common';
import {
  BookingAccessForbiddenError,
  BookingAlreadyInactiveError,
  BookingCancellationDeadlineError,
  BookingCancellationNotAllowedError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class CancelBookingUseCase {
  private readonly CANCELLATION_DEADLINE_MINUTES = 30;

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Cancels a booking by setting its status to INACTIVE.
   * Admin/Driver with org access or the booking owner can cancel.
   * Cancellation is blocked if:
   * 1. Booking is already INACTIVE.
   * 2. Trip is already IN_PROGRESS or FINISHED.
   * 3. Current time is within 30 minutes of departure.
   * @param id - UUID of the booking to cancel
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organization (from JWT, optional for B2C users)
   * @returns BookingResponseDto of the cancelled booking
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if caller is not the owner and not from the same org
   * @throws BookingAlreadyInactiveError if booking is already inactive
   * @throws BookingCancellationNotAllowedError if the trip is IN_PROGRESS or FINISHED
   * @throws BookingCancellationDeadlineError if cancellation is too close to departure
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
    const isOwner = booking.userId === userId;

    if (!hasOrgAccess && !isOwner) {
      throw new BookingAccessForbiddenError(id);
    }

    const instance = await this.tripInstanceRepository.findById(
      booking.tripInstanceId,
    );

    if (!instance) {
      throw new BookingNotFoundError(id);
    }

    if (
      instance.tripStatus === TripStatus.IN_PROGRESS ||
      instance.tripStatus === TripStatus.FINISHED
    ) {
      throw new BookingCancellationNotAllowedError(
        booking.tripInstanceId,
        instance.tripStatus,
      );
    }

    // Validate cancellation deadline (30 minutes before departure)
    const now = new Date();
    const departure = instance.departureTime;
    const diffInMinutes = (departure.getTime() - now.getTime()) / (1000 * 60);

    if (diffInMinutes < this.CANCELLATION_DEADLINE_MINUTES) {
      throw new BookingCancellationDeadlineError(id);
    }

    booking.cancel();

    const updated = await this.bookingRepository.update(booking);

    if (!updated) {
      throw new BookingNotFoundError(id);
    }

    return BookingPresenter.toHTTP(updated);
  }
}
