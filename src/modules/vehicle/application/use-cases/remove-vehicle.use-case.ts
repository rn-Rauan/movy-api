import { Injectable } from '@nestjs/common';
import {
  VehicleAccessForbiddenError,
  VehicleNotFoundError,
} from '../../domain/entities/errors/vehicle.errors';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';

/**
 * Soft-deletes a vehicle by transitioning its status to {@link VehicleStatus.INACTIVE}.
 *
 * @remarks
 * The vehicle record is NOT hard-deleted so that historical trip assignment
 * references remain intact. A hard-delete would violate the `onDelete: Restrict`
 * constraint on the `tripInstance` table.
 *
 * @see {@link VehicleNotFoundError}
 * @see {@link VehicleAccessForbiddenError}
 */
@Injectable()
export class RemoveVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Soft-deletes a vehicle by setting its status to INACTIVE.
   * @param id - UUID of the vehicle to deactivate
   * @param organizationId - UUID of the organization from JWT context
   * @throws VehicleNotFoundError if vehicle does not exist
   * @throws VehicleAccessForbiddenError if vehicle belongs to a different organization
   */
  async execute(id: string, organizationId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    if (vehicle.organizationId !== organizationId) {
      throw new VehicleAccessForbiddenError(id);
    }

    vehicle.deactivate();

    await this.vehicleRepository.update(vehicle);
  }
}
