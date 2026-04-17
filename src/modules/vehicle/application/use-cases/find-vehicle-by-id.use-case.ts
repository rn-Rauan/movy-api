import { Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '../../domain/entities/errors/vehicle.errors';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';

@Injectable()
export class FindVehicleByIdUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Finds a vehicle by its unique ID.
   * @param id - UUID of the vehicle
   * @returns VehicleEntity found
   * @throws VehicleNotFoundError if vehicle does not exist
   */
  async execute(id: string): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    return vehicle;
  }
}
