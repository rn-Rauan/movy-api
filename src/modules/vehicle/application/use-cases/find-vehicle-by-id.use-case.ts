import { Injectable } from '@nestjs/common';
import {
  VehicleAccessForbiddenError,
  VehicleNotFoundError,
} from '../../domain/entities/errors/vehicle.errors';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';

@Injectable()
export class FindVehicleByIdUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Finds a vehicle by its unique ID, scoped to the requesting organization.
   * @param id - UUID of the vehicle
   * @param organizationId - UUID of the organization from JWT context
   * @returns VehicleEntity found
   * @throws VehicleNotFoundError if vehicle does not exist
   * @throws VehicleAccessForbiddenError if vehicle belongs to a different organization
   */
  async execute(id: string, organizationId: string): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    if (vehicle.organizationId !== organizationId) {
      throw new VehicleAccessForbiddenError(id);
    }

    return vehicle;
  }
}
