import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';

@Injectable()
export class AssignVehicleToTripInstanceUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Assigns or removes a vehicle from a trip instance.
   * Passing null unassigns the current vehicle.
   * @param id - UUID of the trip instance
   * @param vehicleId - UUID of the vehicle to assign, or null to unassign
   * @param organizationId - UUID of the organization from JWT context
   * @returns TripInstance with updated vehicle assignment
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceAccessForbiddenError if the instance belongs to a different organization
   */
  async execute(
    id: string,
    vehicleId: string | null,
    organizationId: string,
  ): Promise<TripInstance> {
    const instance = await this.tripInstanceRepository.findById(id);

    if (!instance) {
      throw new TripInstanceNotFoundError(id);
    }

    if (instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    instance.assignVehicle(vehicleId);

    const updated = await this.tripInstanceRepository.update(instance);

    if (!updated) {
      throw new TripInstanceNotFoundError(id);
    }

    return updated;
  }
}
