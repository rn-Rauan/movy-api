import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { Cnh, CnhCategory } from '../../domain/entities/value-objects';
import { UpdateDriverDto } from '../dtos';
import {
  DriverAccessForbiddenError,
  DriverNotFoundError,
  DriverUpdateFailedError,
  PartialCnhUpdateError,
} from '../../domain/entities/errors/driver.errors';

@Injectable()
export class UpdateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Partially updates a driver profile, scoped to the requesting organization.
   * @param id - UUID of the driver to update
   * @param input - Optional fields for update (CNH fields must be sent together)
   * @param organizationId - UUID of the organization from JWT context
   * @returns DriverEntity with updated data
   * @throws DriverNotFoundError if driver does not exist
   * @throws DriverAccessForbiddenError if driver does not belong to the organization
   * @throws PartialCnhUpdateError if only some CNH fields are provided
   * @throws DriverUpdateFailedError if persistence fails
   */
  async execute(
    id: string,
    input: UpdateDriverDto,
    organizationId: string,
  ): Promise<DriverEntity> {
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

    const hasCnhFields = input.cnh || input.cnhCategory || input.cnhExpiresAt;
    const hasAllCnhFields =
      input.cnh && input.cnhCategory && input.cnhExpiresAt;

    if (hasCnhFields && !hasAllCnhFields) {
      throw new PartialCnhUpdateError();
    }

    if (hasAllCnhFields) {
      driver.updateCnh(
        Cnh.create(input.cnh!),
        CnhCategory.create(input.cnhCategory!),
        new Date(input.cnhExpiresAt!),
      );
    }

    if (input.status) {
      if (input.status === 'ACTIVE') {
        driver.activate();
      } else if (input.status === 'INACTIVE') {
        driver.deactivate();
      } else if (input.status === 'SUSPENDED') {
        driver.suspend();
      }
    }

    const updatedDriver = await this.driverRepository.update(driver);

    if (!updatedDriver) {
      throw new DriverUpdateFailedError();
    }

    return updatedDriver;
  }
}
