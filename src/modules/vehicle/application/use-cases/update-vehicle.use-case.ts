import { Injectable } from '@nestjs/common';
import {
  PlateAlreadyInUseError,
  VehicleAccessForbiddenError,
  VehicleInactiveError,
  VehicleNotFoundError,
  VehicleUpdateFailedError,
} from '../../domain/entities/errors/vehicle.errors';
import { Plate } from '../../domain/entities/value-objects/plate.value-object';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';
import { UpdateVehicleDto } from '../dtos';
import { VehicleStatus } from '../../domain/interfaces';

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Partially updates a vehicle, scoped to the requesting organization.
   * @param id - UUID of the vehicle to update
   * @param input - Optional fields for update
   * @param organizationId - UUID of the organization from JWT context
   * @returns VehicleEntity with updated data
   * @throws VehicleNotFoundError if vehicle does not exist
   * @throws VehicleAccessForbiddenError if vehicle belongs to a different organization
   * @throws VehicleInactiveError if vehicle is inactive (soft-deleted)
   * @throws PlateAlreadyInUseError if new plate is already in use by another vehicle
   * @throws VehicleUpdateFailedError if persistence fails
   */
  async execute(
    id: string,
    input: UpdateVehicleDto,
    organizationId: string,
  ): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    if (vehicle.organizationId !== organizationId) {
      throw new VehicleAccessForbiddenError(id);
    }

    if (!vehicle.isActive()) {
      throw new VehicleInactiveError(id);
    }

    if (input.plate) {
      const normalizedPlate = input.plate.trim().toUpperCase().replace('-', '');
      const existing =
        await this.vehicleRepository.findByPlate(normalizedPlate);
      if (existing && existing.id !== id) {
        throw new PlateAlreadyInUseError(input.plate);
      }
      vehicle.updatePlate(Plate.create(input.plate));
    }

    if (input.maxCapacity !== undefined) {
      vehicle.updateMaxCapacity(input.maxCapacity);
    }

    if (input.model !== undefined) {
      vehicle.updateModel(input.model);
    }

    if (input.type !== undefined) {
      vehicle.updateType(input.type);
    }

    if (input.status !== undefined) {
      if (input.status === VehicleStatus.ACTIVE) {
        vehicle.activate();
      } else {
        vehicle.deactivate();
      }
    }

    const updated = await this.vehicleRepository.update(vehicle);

    if (!updated) {
      throw new VehicleUpdateFailedError(id);
    }

    return updated;
  }
}
