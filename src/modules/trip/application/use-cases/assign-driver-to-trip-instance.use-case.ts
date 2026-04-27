import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverNotFoundError } from 'src/modules/driver/domain/entities/errors/driver.errors';

/**
 * Assigns or unassigns a driver from a {@link TripInstance}.
 *
 * Passing `null` as `driverId` unassigns the current driver.
 * The driver must belong to the same database scope (no cross-org validation here —
 * driver existence is checked via {@link DriverRepository}).
 */
@Injectable()
export class AssignDriverToTripInstanceUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly driverRepository: DriverRepository,
  ) {}

  /**
   * Validates instance ownership, optionally validates driver existence, then persists.
   *
   * @param id - UUID of the trip instance
   * @param driverId - UUID of the driver to assign, or `null` to unassign
   * @param organizationId - UUID of the organisation (from JWT)
   * @returns The updated {@link TripInstance}
   * @throws {@link TripInstanceNotFoundError} if the instance does not exist
   * @throws {@link TripInstanceAccessForbiddenError} if the instance belongs to a different org
   * @throws {@link DriverNotFoundError} if `driverId` is provided but the driver does not exist
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

    if (driverId !== null) {
      const driver = await this.driverRepository.findById(driverId);
      if (!driver) {
        throw new DriverNotFoundError(driverId);
      }
    }

    instance.assignDriver(driverId);

    const updated = await this.tripInstanceRepository.update(instance);

    if (!updated) {
      throw new TripInstanceNotFoundError(id);
    }

    return updated;
  }
}
