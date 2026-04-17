import { Injectable } from '@nestjs/common';
import {
  VehicleAccessForbiddenError,
  VehicleNotFoundError,
} from '../../domain/entities/errors/vehicle.errors';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';

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
