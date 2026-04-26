import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { BookingAccessForbiddenError } from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';

@Injectable()
export class FindBookingsByTripInstanceUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  async execute(
    tripInstanceId: string,
    options: PaginationOptions,
    callerOrganizationId?: string,
  ) {
    const instance = await this.tripInstanceRepository.findById(tripInstanceId);

    if (!instance) {
      throw new TripInstanceNotFoundError(tripInstanceId);
    }

    const hasOrgAccess =
      callerOrganizationId != null &&
      instance.organizationId === callerOrganizationId;

    if (!hasOrgAccess) {
      throw new BookingAccessForbiddenError(tripInstanceId);
    }

    return this.bookingRepository.findByTripInstanceId(tripInstanceId, options);
  }
}
