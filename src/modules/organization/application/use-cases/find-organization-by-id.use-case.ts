import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { OrganizationNotFoundError, OrganizationForbiddenError } from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';
import { TenantContextParams } from '../dtos';

@Injectable()
export class FindOrganizationByIdUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(id: string, tenantContext?: TenantContextParams): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization || organization.status === 'INACTIVE') {
      throw new OrganizationNotFoundError(id);
    }

    if (tenantContext && !tenantContext.isDev && tenantContext.tenantOrganizationId) {
      if (organization.id !== tenantContext.tenantOrganizationId) {
        throw new OrganizationForbiddenError(id);
      }
    }

    return organization;
  }
}
