import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  InactiveOrganizationError,
  OrganizationForbiddenError,
  OrganizationNotFoundError,
} from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';
import { TenantContextParams } from '../dtos';

@Injectable()
export class DisableOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    id: string,
    tenantContext?: TenantContextParams,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new OrganizationNotFoundError(id);
    }

    if (
      tenantContext &&
      !tenantContext.isDev &&
      tenantContext.tenantOrganizationId &&
      organization.id !== tenantContext.tenantOrganizationId
    ) {
      throw new OrganizationForbiddenError(id);
    }

    if (organization.status === 'INACTIVE') {
      throw new InactiveOrganizationError(id);
    }

    organization.setStatus('INACTIVE');
    await this.organizationRepository.update(organization);

    return organization;
  }
}
