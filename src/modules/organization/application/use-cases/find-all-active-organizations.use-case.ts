import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { Organization } from '../../domain/entities';

@Injectable()
export class FindAllActiveOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    return this.organizationRepository.findAllActive(options);
  }
}
