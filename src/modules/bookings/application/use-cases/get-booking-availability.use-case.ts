import { Injectable } from '@nestjs/common';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingAvailabilityResponseDto } from '../dtos/booking-availability-response.dto';

const BOOKABLE_STATUSES = new Set([TripStatus.SCHEDULED, TripStatus.CONFIRMED]);

@Injectable()
export class GetBookingAvailabilityUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  /**
   * Returns availability information for a trip instance.
   * Any authenticated user can check availability before booking.
   * @param tripInstanceId - UUID of the trip instance
   * @returns BookingAvailabilityResponseDto with slot counts and bookability flag
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   */
  async execute(
    tripInstanceId: string,
  ): Promise<BookingAvailabilityResponseDto> {
    const instance = await this.tripInstanceRepository.findById(tripInstanceId);

    if (!instance) {
      throw new TripInstanceNotFoundError(tripInstanceId);
    }

    const activeCount =
      await this.bookingRepository.countActiveByTripInstance(tripInstanceId);

    const availableSlots = Math.max(0, instance.totalCapacity - activeCount);

    const isBookable =
      BOOKABLE_STATUSES.has(instance.tripStatus) && availableSlots > 0;

    const dto = new BookingAvailabilityResponseDto();
    dto.tripInstanceId = tripInstanceId;
    dto.tripStatus = instance.tripStatus;
    dto.totalCapacity = instance.totalCapacity;
    dto.activeCount = activeCount;
    dto.availableSlots = availableSlots;
    dto.isBookable = isBookable;

    return dto;
  }
}
