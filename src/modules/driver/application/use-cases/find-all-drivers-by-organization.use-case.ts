import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { PaginatedResponse, PaginationOptions } from 'src/shared';

/**
 * Returns a paginated list of drivers linked to the requesting organization.
 *
 * @remarks
 * Delegates directly to {@link DriverRepository.findByOrganizationId}.
 * Drivers are filtered by active `DRIVER` role membership in the organization.
 */
@Injectable()
export class FindAllDriversByOrganizationUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Lists all drivers belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with DriverEntity list
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>> {
    return this.driverRepository.findByOrganizationId(organizationId, options);
  }
}
