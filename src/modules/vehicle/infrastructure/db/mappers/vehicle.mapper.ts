import { Vehicle as PrismaVehicle } from 'generated/prisma/client';
import { VehicleEntity } from 'src/modules/vehicle/domain/entities/vehicle.entity';
import { Plate } from 'src/modules/vehicle/domain/entities/value-objects/plate.value-object';
import { VehicleStatus } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-status.enum';
import { VehicleType } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-type.enum';

/**
 * Bidirectional mapper between the Prisma `Vehicle` model and the {@link VehicleEntity} domain object.
 *
 * Reconstructs the {@link Plate} Value Object from the persisted string via `Plate.restore()`.
 * Contains no business logic.
 */
export class VehicleMapper {
  /**
   * Converts a raw Prisma `Vehicle` record to a {@link VehicleEntity} domain object.
   *
   * @param raw - Raw `Vehicle` record returned by the Prisma client
   * @returns A fully hydrated {@link VehicleEntity} instance
   */
  static toDomain(raw: PrismaVehicle): VehicleEntity {
    return VehicleEntity.restore({
      id: raw.id,
      plate: Plate.restore(raw.plate),
      model: raw.model,
      type: raw.type as VehicleType,
      maxCapacity: raw.maxCapacity,
      organizationId: raw.organizationId,
      status: raw.status as VehicleStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link VehicleEntity} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param entity - The {@link VehicleEntity} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.vehicle.create({ data })`
   */
  static toPersistence(entity: VehicleEntity): PrismaVehicle {
    return {
      id: entity.id,
      plate: entity.plate.value_,
      model: entity.model,
      type: entity.type,
      maxCapacity: entity.maxCapacity,
      organizationId: entity.organizationId,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
