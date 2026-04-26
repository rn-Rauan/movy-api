import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import {
  TripInstanceRepository,
  TripStatus,
} from 'src/modules/trip/domain/interfaces';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces/trip-template.repository';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { EnrollmentType, BookingRepository } from '../../domain/interfaces';
import { Booking } from '../../domain/entities';
import {
  BookingAlreadyExistsError,
  BookingCreationFailedError,
  TripInstanceFullError,
  TripInstanceNotBookableError,
  TripPriceNotAvailableError,
} from '../../domain/entities/errors/booking.errors';
import { CreateBookingDto } from '../dtos';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { PaymentCreationFailedError } from 'src/modules/payment/domain/errors/payment.errors';

@Injectable()
export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  /**
   * Creates a new booking for a user in a trip instance.
   * - recordedPrice is resolved server-side from the TripTemplate (never trusted from client)
   * - Capacity is enforced against instance.totalCapacity before saving
   * @param dto - Booking creation data (recordedPrice field ignored)
   * @param userId - UUID of the authenticated user (from JWT)
   * @returns BookingResponseDto of the created booking
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceNotBookableError if the trip is not in SCHEDULED or CONFIRMED status
   * @throws TripInstanceFullError if the trip has reached its maximum capacity
   * @throws BookingAlreadyExistsError if the user already has an active booking for this trip instance
   * @throws TripPriceNotAvailableError if no price is configured for the given enrollmentType
   * @throws InvalidBookingStopError if boardingStop or alightingStop are invalid
   * @throws BookingCreationFailedError if persistence fails
   */
  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    const instance = await this.tripInstanceRepository.findById(
      dto.tripInstanceId,
    );

    if (!instance) {
      throw new TripInstanceNotFoundError(dto.tripInstanceId);
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

    const activeCount = await this.bookingRepository.countActiveByTripInstance(
      dto.tripInstanceId,
    );

    if (activeCount >= instance.totalCapacity) {
      throw new TripInstanceFullError(dto.tripInstanceId);
    }

    const existing = await this.bookingRepository.findByUserAndTripInstance(
      userId,
      dto.tripInstanceId,
    );

    if (existing) {
      throw new BookingAlreadyExistsError(userId, dto.tripInstanceId);
    }

    const template = await this.tripTemplateRepository.findById(
      instance.tripTemplateId,
    );

    const recordedPrice = this.resolvePrice(template, dto.enrollmentType);

    const booking = Booking.create({
      organizationId: instance.organizationId,
      userId,
      tripInstanceId: dto.tripInstanceId,
      enrollmentType: dto.enrollmentType,
      recordedPrice,
      boardingStop: dto.boardingStop,
      alightingStop: dto.alightingStop,
    });

    const saved = await this.bookingRepository.save(booking);

    if (!saved) {
      throw new BookingCreationFailedError();
    }

    const payment = PaymentEntity.create({
      organizationId: saved.organizationId,
      enrollmentId: saved.id,
      method: dto.method,
      amount: saved.recordedPrice,
    });

    const savedPayment = await this.paymentRepository.save(payment);
    if (!savedPayment) {
      throw new PaymentCreationFailedError();
    }

    return saved;
  }

  private resolvePrice(
    template: import('src/modules/trip/domain/entities').TripTemplate | null,
    enrollmentType: EnrollmentType,
  ): Money {
    let price: Money | null | undefined;

    if (template) {
      if (enrollmentType === EnrollmentType.ONE_WAY) {
        price = template.priceOneWay;
      } else if (enrollmentType === EnrollmentType.RETURN) {
        price = template.priceReturn;
      } else {
        price = template.priceRoundTrip;
      }
    }

    if (!price) {
      throw new TripPriceNotAvailableError(enrollmentType);
    }

    return Money.create(price.toNumber());
  }
}
