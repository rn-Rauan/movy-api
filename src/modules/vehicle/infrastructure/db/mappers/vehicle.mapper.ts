import { Vehicle as PrismaVehicle } from 'generated/prisma/client';
import { VehicleEntity } from 'src/modules/vehicle/domain/entities/vehicle.entity';
import { Plate } from 'src/modules/vehicle/domain/entities/value-objects/plate.value-object';
import { VehicleStatus } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-status.enum';
import { VehicleType } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-type.enum';

/**
 * VehicleMapper
 *
 * Responsibility:
 * - Map between Prisma Vehicle (persistence) and VehicleEntity (domain)
 * - Hydrate value objects from raw database values
 * - Convert domain entity to persistence format
 */
export class VehicleMapper {
  /**
   * Map a raw Prisma Vehicle row to a VehicleEntity domain object.
   * @param raw - PrismaVehicle row from database
   * @returns Hydrated VehicleEntity
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
   * Map a VehicleEntity domain object to a plain object suitable for Prisma persistence.
   * @param entity - VehicleEntity domain object
   * @returns Prisma-compatible persistence payload
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
