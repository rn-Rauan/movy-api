import { Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '../../domain/entities/errors/vehicle.errors';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';

@Injectable()
export class RemoveVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Soft-deletes a vehicle by setting its status to INACTIVE.
   * @param id - UUID of the vehicle to deactivate
   * @throws VehicleNotFoundError if vehicle does not exist
   */
  async execute(id: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    vehicle.deactivate();

    await this.vehicleRepository.update(vehicle);
  }
}
