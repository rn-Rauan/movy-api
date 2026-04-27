import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import {
  DriverAccessForbiddenError,
  DriverNotFoundError,
} from '../../domain/entities/errors/driver.errors';

/**
 * Retrieves a driver profile by UUID, scoped to the requesting organization.
 *
 * @remarks
 * Validates organization ownership via {@link DriverRepository.belongsToOrganization}
 * to prevent cross-tenant data leaks.
 * Throws {@link DriverNotFoundError} if absent or {@link DriverAccessForbiddenError}
 * if the driver belongs to a different organization.
 */
@Injectable()
export class FindDriverByIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Finds a driver by its unique ID, scoped to the requesting organization.
   * @param id - UUID of the driver
   * @param organizationId - UUID of the organization from JWT context
   * @returns DriverEntity found
   * @throws DriverNotFoundError if driver does not exist
   * @throws DriverAccessForbiddenError if driver does not belong to the organization
   */
  async execute(id: string, organizationId: string): Promise<DriverEntity> {
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

    return driver;
  }
}
