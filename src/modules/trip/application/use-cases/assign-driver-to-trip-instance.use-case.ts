import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';

@Injectable()
export class AssignDriverToTripInstanceUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Assigns or removes a driver from a trip instance.
   * Passing null unassigns the current driver.
   * @param id - UUID of the trip instance
   * @param driverId - UUID of the driver to assign, or null to unassign
   * @param organizationId - UUID of the organization from JWT context
   * @returns TripInstance with updated driver assignment
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceAccessForbiddenError if the instance belongs to a different organization
   */
  async execute(
    id: string,
    driverId: string | null,
    organizationId: string,
  ): Promise<TripInstance> {
    const instance = await this.tripInstanceRepository.findById(id);

    if (!instance) {
      throw new TripInstanceNotFoundError(id);
    }

    if (instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    instance.assignDriver(driverId);

    const updated = await this.tripInstanceRepository.update(instance);

    if (!updated) {
      throw new TripInstanceNotFoundError(id);
    }

    return updated;
  }
}
