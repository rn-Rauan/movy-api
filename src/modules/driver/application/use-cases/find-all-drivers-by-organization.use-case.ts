import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { PaginatedResponse, PaginationOptions } from 'src/shared';

@Injectable()
export class FindAllDriversByOrganizationUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>> {
    return this.driverRepository.findByOrganizationId(organizationId, options);
  }
}
