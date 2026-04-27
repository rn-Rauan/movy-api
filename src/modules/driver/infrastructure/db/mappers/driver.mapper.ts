import { Driver as PrismaDriver } from 'generated/prisma/client';
import { DriverEntity } from 'src/modules/driver/domain/entities/driver.entity';
import {
  Cnh,
  CnhCategory,
} from 'src/modules/driver/domain/entities/value-objects';
import { CnhCategoryType } from 'src/modules/driver/domain/entities/value-objects/cnh-category.value-object';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';

/**
 * Bidirectional mapper between the Prisma `Driver` model and the {@link DriverEntity} domain object.
 *
 * Reconstructs Value Objects (`Cnh`, `CnhCategory`) from their persisted string
 * representations and casts the `driverStatus` enum. Contains no business logic.
 */
export class DriverMapper {
  /**
   * Converts a raw Prisma `Driver` record to a {@link DriverEntity} domain object.
   *
   * @param raw - Raw `Driver` record returned by the Prisma client
   * @returns A fully hydrated {@link DriverEntity} instance
   */
  static toDomain(raw: PrismaDriver): DriverEntity {
    return DriverEntity.restore({
      id: raw.id,
      userId: raw.userId,
      cnh: Cnh.restore(raw.cnh),
      cnhCategory: CnhCategory.restore(raw.cnhCategory as CnhCategoryType),
      cnhExpiresAt: raw.cnhExpiresAt,
      driverStatus: raw.driverStatus as DriverStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link DriverEntity} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param driver - The {@link DriverEntity} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.driver.create({ data })`
   */
  static toPersistence(driver: DriverEntity): PrismaDriver {
    return {
      id: driver.id,
      userId: driver.userId,
      cnh: driver.cnh.value_,
      cnhCategory: driver.cnhCategory.value_,
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
