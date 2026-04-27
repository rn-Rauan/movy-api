import { Injectable } from '@nestjs/common';
import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/interfaces/vehicle.repository';
import { PaginatedResponse, PaginationOptions } from 'src/shared';

/**
 * Returns a paginated list of all vehicles belonging to an organisation.
 *
 * Delegates entirely to {@link VehicleRepository.findByOrganizationId}.
 * Results are ordered by `createdAt` descending (repository-defined ordering).
 */
@Injectable()
export class FindAllVehiclesByOrganizationUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  /**
   * Lists all vehicles belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with VehicleEntity list
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<VehicleEntity>> {
    return this.vehicleRepository.findByOrganizationId(organizationId, options);
  }
}
