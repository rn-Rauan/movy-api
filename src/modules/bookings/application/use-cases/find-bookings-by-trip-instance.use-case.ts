import { Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { BookingAccessForbiddenError } from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class FindBookingsByTripInstanceUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Lists all bookings for a given trip instance.
   * Only org members (Admin/Driver) can view the passenger list.
   * @param tripInstanceId - UUID of the trip instance
   * @param options - Pagination options (page, limit)
   * @param callerOrganizationId - organizationId from JWT (required for access)
   * @returns Paginated response with BookingResponseDto list
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws BookingAccessForbiddenError if caller does not belong to the trip's organization
   */
  async execute(
    tripInstanceId: string,
    options: PaginationOptions,
    callerOrganizationId?: string,
  ): Promise<PaginatedResponse<BookingResponseDto>> {
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

    const result = await this.bookingRepository.findByTripInstanceId(
      tripInstanceId,
      options,
    );

    return {
      ...result,
      data: BookingPresenter.toHTTPList(result.data),
    };
  }
}
