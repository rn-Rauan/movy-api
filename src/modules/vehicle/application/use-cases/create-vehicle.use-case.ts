import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PlateAlreadyInUseError,
  VehicleCreationFailedError,
} from '../../domain/entities/errors/vehicle.errors';
import { Plate } from '../../domain/entities/value-objects/plate.value-object';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';
import { CreateVehicleDto } from '../dtos';

/**
 * Registers a new vehicle for the requesting organisation.
 *
 * @remarks
 * Checks plate uniqueness before persisting. Plate normalisation (uppercase, hyphen removed)
 * is applied before the duplicate check and delegated to {@link Plate.create} for format validation.
 *
 * @see {@link PlateAlreadyInUseError}
 * @see {@link VehicleCreationFailedError}
 */
@Injectable()
export class CreateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Registers a new vehicle for the given organization.
   * @param input - Vehicle creation data (plate, model, type, maxCapacity)
   * @param organizationId - UUID of the owning organization (from JWT context)
   * @returns VehicleEntity created and persisted
   * @throws PlateAlreadyInUseError if plate is already registered
   * @throws VehicleCreationFailedError if persistence fails
   */
  async execute(
    input: CreateVehicleDto,
    organizationId: string,
  ): Promise<VehicleEntity> {
    const existing = await this.vehicleRepository.findByPlate(
      input.plate.trim().toUpperCase().replace('-', ''),
    );
    if (existing) {
      throw new PlateAlreadyInUseError(input.plate);
    }

    const vehicle = VehicleEntity.create({
      id: randomUUID(),
      plate: Plate.create(input.plate),
      model: input.model,
      type: input.type,
      maxCapacity: input.maxCapacity,
      organizationId,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    if (!saved) {
      throw new VehicleCreationFailedError();
    }

    return saved;
  }
}
