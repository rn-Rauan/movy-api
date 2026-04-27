import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  InactiveOrganizationError,
  OrganizationForbiddenError,
  OrganizationNotFoundError,
} from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';
import { TenantContextParams } from '../dtos';

/**
 * Soft-disables an organization by setting its status to `INACTIVE`.
 *
 * @remarks
 * Validates tenant ownership before mutation.
 * Throws {@link InactiveOrganizationError} if the organization is already inactive.
 * Does NOT hard-delete the record.
 */
@Injectable()
export class DisableOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Disables an organization by ID.
   * @param id - UUID of the organization to disable
   * @param tenantContext - Context of the tenant for access validation
   * @returns Organization entity with status INACTIVE
   * @throws OrganizationNotFoundError if the organization does not exist
   * @throws OrganizationForbiddenError if the tenant does not have access to the organization
   * @throws InactiveOrganizationError if the organization is already inactive
   */
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
