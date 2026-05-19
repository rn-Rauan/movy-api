import { Driver as PrismaDriver } from 'generated/prisma/client';
import { DriverEntity } from 'src/modules/driver/domain/entities/driver.entity';
import {
  Cnh,
  CnhCategories,
} from 'src/modules/driver/domain/entities/value-objects';
import { CnhCategoryType } from 'src/modules/driver/domain/entities/value-objects/cnh-categories.value-object';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';

/**
 * Bidirectional mapper between the Prisma `Driver` model and the {@link DriverEntity} domain object.
 *
 * Reconstructs Value Objects (`Cnh`, `CnhCategories`) from their persisted
 * representations. The `cnhCategories` column is a Postgres `text[]` whose
 * items are already validated DETRAN categories.
 */
export class DriverMapper {
  /**
   * Converts a raw Prisma `Driver` record to a {@link DriverEntity} domain object.
   */
  static toDomain(raw: PrismaDriver): DriverEntity {
    return DriverEntity.restore({
      id: raw.id,
      userId: raw.userId,
      cnh: Cnh.restore(raw.cnh),
      cnhCategories: CnhCategories.restore(
        raw.cnhCategories as CnhCategoryType[],
      ),
      cnhExpiresAt: raw.cnhExpiresAt,
      driverStatus: raw.driverStatus as DriverStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link DriverEntity} to the plain object expected by Prisma.
   */
  static toPersistence(driver: DriverEntity): PrismaDriver {
    return {
      id: driver.id,
      userId: driver.userId,
      cnh: driver.cnh.value_,
      cnhCategories: [...driver.cnhCategories.values],
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
