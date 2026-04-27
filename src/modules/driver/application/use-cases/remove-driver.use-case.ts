import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import {
  DriverAccessForbiddenError,
  DriverNotFoundError,
} from '../../domain/entities/errors/driver.errors';

/**
 * Soft-deactivates a driver profile by setting its status to `INACTIVE`.
 *
 * @remarks
 * Organization ownership is verified before mutation.
 * The driver record is NOT hard-deleted; use-case calls
 * {@link DriverEntity.deactivate} followed by {@link DriverRepository.update}.
 */
@Injectable()
export class RemoveDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Soft-deletes a driver by setting status to INACTIVE.
   * @param id - UUID of the driver to deactivate
   * @param organizationId - UUID of the organization from JWT context
   * @throws DriverNotFoundError if driver does not exist
   * @throws DriverAccessForbiddenError if driver does not belong to the organization
   */
  async execute(id: string, organizationId: string): Promise<void> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new DriverNotFoundError(id);
    }

    const belongs = await this.driverRepository.belongsToOrganization(
      id,
      organizationId,
    );

    if (!belongs) {
      throw new DriverAccessForbiddenError(id);
    }

    driver.deactivate();

    await this.driverRepository.update(driver);
  }
}
