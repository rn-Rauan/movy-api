import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { Organization } from '../../domain/entities';
import {
  InactiveOrganizationError,
  OrganizationAlreadyExistsError,
  OrganizationEmailAlreadyExistsError,
  OrganizationForbiddenError,
  OrganizationNotFoundError,
  OrganizationSlugAlreadyExistsError,
} from '../../domain/entities/errors/organization.errors';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { TenantContextParams } from '../dtos';

/**
 * Partially updates an existing organization's data.
 *
 * @remarks
 * Validates tenant ownership before mutation.
 * Throws conflict errors ({@link OrganizationAlreadyExistsError},
 * {@link OrganizationEmailAlreadyExistsError}, {@link OrganizationSlugAlreadyExistsError})
 * if any of the updated unique fields conflict with another organization.
 * Inactive organizations cannot be updated ({@link InactiveOrganizationError}).
 */
@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Partially updates an existing organization's data.
   * @param id - ID of the organization to update
   * @param updateDto - Optional fields for update
   * @param tenantContext - Context of the tenant for access validation
   * @returns Updated Organization entity
   * @throws OrganizationNotFoundError if the organization does not exist
   * @throws OrganizationForbiddenError if the tenant does not have access to the organization
   * @throws InactiveOrganizationError if the organization is already inactive
   * @throws OrganizationAlreadyExistsError if the new CNPJ is already in use
   * @throws OrganizationEmailAlreadyExistsError if the new email is already in use
   * @throws OrganizationSlugAlreadyExistsError if the new slug is already in use
   */
  async execute(
    id: string,
    updateDto: UpdateOrganizationDto,
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

    if (updateDto.name) {
      organization.setName(updateDto.name);
    }

    if (updateDto.email) {
      const existingByEmail = await this.organizationRepository.findByEmail(
        updateDto.email,
      );
      if (existingByEmail && existingByEmail.id !== organization.id) {
        throw new OrganizationEmailAlreadyExistsError(updateDto.email);
      }
      organization.setEmail(updateDto.email);
    }

    if (updateDto.cnpj) {
      const existingOrganization = await this.organizationRepository.findByCnpj(
        updateDto.cnpj,
      );
      if (existingOrganization && existingOrganization.id !== organization.id) {
        throw new OrganizationAlreadyExistsError(updateDto.cnpj);
      }
      organization.setCnpj(updateDto.cnpj);
    }

    if (updateDto.telephone) {
      organization.setTelephone(updateDto.telephone);
    }

    if (updateDto.slug) {
      const existingBySlug = await this.organizationRepository.findBySlug(
        updateDto.slug,
      );
      if (existingBySlug && existingBySlug.id !== organization.id) {
        throw new OrganizationSlugAlreadyExistsError(updateDto.slug);
      }
      organization.setSlug(updateDto.slug);
    }

    if (updateDto.address) {
      organization.setAddress(updateDto.address);
    }

    await this.organizationRepository.update(organization);

    return organization;
  }
}
