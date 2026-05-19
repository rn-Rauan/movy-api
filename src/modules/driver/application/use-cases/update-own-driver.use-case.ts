import { Injectable } from '@nestjs/common';
import { DriverEntity } from '../../domain/entities/driver.entity';
import {
  DriverInactiveError,
  DriverProfileNotFoundError,
  DriverUpdateFailedError,
} from '../../domain/entities/errors/driver.errors';
import { CnhCategories } from '../../domain/entities/value-objects';
import { DriverRepository } from '../../domain/interfaces';
import { DriverStatus } from '../../domain/interfaces/enums/driver-status.enum';
import { UpdateOwnDriverDto } from '../dtos';

/**
 * Self-service update of a driver's own profile — `PATCH /drivers/me`.
 *
 * @remarks
 * Resolves the driver by the authenticated `userId`. The driver may only
 * update `cnhExpiresAt` and `cnhCategories`; changing the CNH number or
 * status requires an admin via `PUT /drivers/:id`.
 *
 * Drivers in `INACTIVE` or `SUSPENDED` state cannot self-update — they must
 * be reactivated by an admin first. An empty payload is a no-op and returns
 * the current driver state without persisting.
 */
@Injectable()
export class UpdateOwnDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * @param userId - UUID of the authenticated user (from {@link TenantContext})
   * @param input - Optional fields to update
   * @throws {@link DriverProfileNotFoundError} if the user has no driver profile
   * @throws {@link DriverInactiveError} if the driver is INACTIVE or SUSPENDED
   * @throws {@link DriverUpdateFailedError} if persistence fails
   */
  async execute(
    userId: string,
    input: UpdateOwnDriverDto,
  ): Promise<DriverEntity> {
    const driver = await this.driverRepository.findByUserId(userId);
    if (!driver) {
      throw new DriverProfileNotFoundError(userId);
    }

    if (driver.driverStatus !== DriverStatus.ACTIVE) {
      throw new DriverInactiveError(driver.id, driver.driverStatus);
    }

    const hasExpiresAt = input.cnhExpiresAt !== undefined;
    const hasCategories =
      input.cnhCategories !== undefined && input.cnhCategories.length > 0;

    if (!hasExpiresAt && !hasCategories) {
      return driver;
    }

    if (hasExpiresAt) {
      driver.setCnhExpiresAt(new Date(input.cnhExpiresAt!));
    }
    if (hasCategories) {
      driver.setCnhCategories(CnhCategories.create(input.cnhCategories!));
    }

    const updated = await this.driverRepository.update(driver);
    if (!updated) {
      throw new DriverUpdateFailedError();
    }
    return updated;
  }
}
