import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { Booking } from '../../domain/entities';
import {
  BookingAlreadyExistsError,
  BookingCreationFailedError,
  TripInstanceNotBookableError,
} from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto, CreateBookingDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Creates a new booking for a user in a trip instance.
   * @param dto - Booking creation data
   * @param userId - UUID of the authenticated user (from JWT)
   * @param organizationId - UUID of the organization (from JWT)
   * @returns BookingResponseDto of the created booking
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceAccessForbiddenError if the trip belongs to a different organization
   * @throws TripInstanceNotBookableError if the trip is not in SCHEDULED or CONFIRMED status
   * @throws BookingAlreadyExistsError if the user already has a booking for this trip instance
   * @throws InvalidBookingStopError if boardingStop or alightingStop are invalid
   * @throws BookingCreationFailedError if persistence fails
   */
  async execute(
    dto: CreateBookingDto,
    userId: string,
    organizationId: string,
  ): Promise<BookingResponseDto> {
    const instance = await this.tripInstanceRepository.findById(
      dto.tripInstanceId,
    );

    if (!instance) {
      throw new TripInstanceNotFoundError(dto.tripInstanceId);
    }

    if (instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(dto.tripInstanceId);
    }

    if (
      instance.tripStatus !== TripStatus.SCHEDULED &&
      instance.tripStatus !== TripStatus.CONFIRMED
    ) {
      throw new TripInstanceNotBookableError(
        dto.tripInstanceId,
        instance.tripStatus,
      );
    }

    const existing = await this.bookingRepository.findByUserAndTripInstance(
      userId,
      dto.tripInstanceId,
    );

    if (existing) {
      throw new BookingAlreadyExistsError(userId, dto.tripInstanceId);
    }

    const booking = Booking.create({
      organizationId,
      userId,
      tripInstanceId: dto.tripInstanceId,
      enrollmentType: dto.enrollmentType,
      recordedPrice: Money.create(dto.recordedPrice),
      boardingStop: dto.boardingStop,
      alightingStop: dto.alightingStop,
    });

    const saved = await this.bookingRepository.save(booking);

    if (!saved) {
      throw new BookingCreationFailedError();
    }

    return BookingPresenter.toHTTP(saved);
  }
}
