import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { Organization } from '../../domain/entities';
import {
  InactiveOrganizationError,
  OrganizationAlreadyExistsError,
  OrganizationNotFoundError,
} from '../../domain/entities/errors/organization.errors';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(
    id: string,
    updateDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new OrganizationNotFoundError(id);
    }

    if (organization.status === 'INACTIVE') {
      throw new InactiveOrganizationError(id);
    }

    if (updateDto.name) {
      organization.setName(updateDto.name);
    }

    if (updateDto.email) {
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
      organization.setSlug(updateDto.slug);
    }

    if (updateDto.address) {
      organization.setAddress(updateDto.address);
    }

    await this.organizationRepository.update(organization);

    return organization;
  }
}
