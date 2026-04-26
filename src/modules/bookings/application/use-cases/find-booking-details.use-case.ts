import { Injectable } from '@nestjs/common';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import {
  BookingAccessForbiddenError,
  BookingNotFoundError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingDetailsResponseDto } from '../dtos/booking-details-response.dto';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class FindBookingDetailsUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Returns a booking with enriched trip instance data (departure time, status, available slots).
   * Owner or org member can access.
   * @param id - UUID of the booking
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organization (from JWT, optional for B2C users)
   * @returns BookingDetailsResponseDto with trip data included
   * @throws BookingNotFoundError if the booking does not exist
   * @throws BookingAccessForbiddenError if caller is not the owner and not from the same org
   * @throws TripInstanceNotFoundError if the linked trip instance no longer exists
   */
  async execute(
    id: string,
    userId: string,
    organizationId?: string,
  ): Promise<BookingDetailsResponseDto> {
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

    const instance = await this.tripInstanceRepository.findById(
      booking.tripInstanceId,
    );

    if (!instance) {
      throw new TripInstanceNotFoundError(booking.tripInstanceId);
    }

    const activeCount = await this.bookingRepository.countActiveByTripInstance(
      booking.tripInstanceId,
    );

    const base = BookingPresenter.toHTTP(booking);

    return Object.assign(new BookingDetailsResponseDto(base), {
      tripDepartureTime: instance.departureTime,
      tripArrivalEstimate: instance.arrivalEstimate,
      tripStatus: instance.tripStatus,
      totalCapacity: instance.totalCapacity,
      availableSlots: Math.max(0, instance.totalCapacity - activeCount),
    });
  }
}
