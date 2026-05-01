import { Injectable } from '@nestjs/common';
import { TripInstanceNotFoundError } from 'src/modules/trip/domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import { BookingAccessForbiddenError } from '../../domain/entities/errors/booking.errors';
import { BookingRepository } from '../../domain/interfaces';

/**
 * Returns the list of active passengers (name + boarding stop) for a trip instance.
 *
 * Access is granted when the caller has an `ACTIVE` booking on the trip **or** belongs
 * to the organisation that owns it. This lets fellow passengers see who else is riding
 * while preventing arbitrary authenticated users from listing passenger names.
 */
@Injectable()
export class FindTripPassengersUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Validates access and returns the passenger list.
   *
   * @param tripInstanceId - UUID of the trip instance
   * @param callerId - UUID of the authenticated user (from JWT)
   * @param callerOrganizationId - UUID of the caller's organisation (from JWT), if any
   * @returns Array of `{ name, boardingStop }` for all `ACTIVE` bookings on the trip
   * @throws {@link TripInstanceNotFoundError} if the trip instance does not exist
   * @throws {@link BookingAccessForbiddenError} if the caller has no active booking and is not an org member
   */
  async execute(
    tripInstanceId: string,
    callerId: string,
    callerOrganizationId?: string,
  ): Promise<Array<{ name: string; boardingStop: string }>> {
    const instance = await this.tripInstanceRepository.findById(tripInstanceId);

    if (!instance) {
      throw new TripInstanceNotFoundError(tripInstanceId);
    }

    const isOrgMember =
      callerOrganizationId != null &&
      instance.organizationId === callerOrganizationId;

    if (!isOrgMember) {
      const ownBooking = await this.bookingRepository.findByUserAndTripInstance(
        callerId,
        tripInstanceId,
      );

      if (!ownBooking) {
        throw new BookingAccessForbiddenError(tripInstanceId);
      }
    }

    return this.bookingRepository.findActivePassengersByTripInstanceId(
      tripInstanceId,
    );
  }
}
