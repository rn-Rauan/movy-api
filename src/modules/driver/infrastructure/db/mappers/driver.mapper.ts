import { Driver as PrismaDriver } from 'generated/prisma/client';
import { DriverEntity } from 'src/modules/driver/domain/entities/driver.entity';
import {
  Cnh,
  CnhCategory,
} from 'src/modules/driver/domain/entities/value-objects';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';

/**
 * Driver Mapper
 *
 * Responsibility:
 * - Map between Prisma Driver (persistence) and DriverEntity (domain)
 * - Hydrate value objects from raw database values
 * - Convert domain entity to persistence format
 */
export class DriverMapper {
  /**
   * Map PrismaDriver to DriverEntity domain entity
   * @param raw PrismaDriver entity from database
   * @returns DriverEntity domain entity
   */
  static toDomain(raw: PrismaDriver): DriverEntity {
    return DriverEntity.restore({
      id: raw.id,
      userId: raw.userId,
      organizationId: raw.organizationId,
      cnh: Cnh.create(raw.cnh),
      cnhCategory: CnhCategory.create(raw.cnhCategory),
      cnhExpiresAt: raw.cnhExpiresAt,
      driverStatus: raw.driverStatus as DriverStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map DriverEntity domain entity to PrismaDriver for persistence
   * @param driver DriverEntity domain entity
   * @returns PrismaDriver persistence entity
   */
  static toPersistence(driver: DriverEntity): Omit<PrismaDriver, 'id'> & { id?: string } {
    return {
      id: driver.id,
      userId: driver.userId,
      organizationId: driver.organizationId,
      cnh: driver.cnh.value_,
      cnhCategory: driver.cnhCategory.value_,
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus as DriverStatus,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
