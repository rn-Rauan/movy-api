import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  OrganizationNotFoundError,
  OrganizationForbiddenError,
} from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';
import { TenantContextParams } from '../dtos';

/**
 * Retrieves an active organization by UUID, with optional tenant-context scoping.
 *
 * @remarks
 * Treats `INACTIVE` organizations as non-existent (throws {@link OrganizationNotFoundError}).
 * When `tenantContext` is provided and the caller is not a dev, enforces that the
 * requested organization matches the caller's own organization.
 */
@Injectable()
export class FindOrganizationByIdUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Find an active organization by ID.
   * @param id - UUID of the organization
   * @param tenantContext - Context of the tenant for access validation
   * @returns Found Organization entity
   * @throws OrganizationNotFoundError if the organization does not exist or is inactive
   * @throws OrganizationForbiddenError if the tenant does not have access to the organization
   */
  async execute(
    id: string,
    tenantContext?: TenantContextParams,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization || organization.status === 'INACTIVE') {
      throw new OrganizationNotFoundError(id);
    }

    if (
      tenantContext &&
      !tenantContext.isDev &&
      tenantContext.tenantOrganizationId
    ) {
      if (organization.id !== tenantContext.tenantOrganizationId) {
        throw new OrganizationForbiddenError(id);
      }
    }

    return organization;
  }
}
