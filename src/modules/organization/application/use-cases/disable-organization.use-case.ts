import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  InactiveOrganizationError,
  OrganizationNotFoundError,
} from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';

@Injectable()
export class DisableOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new OrganizationNotFoundError(id);
    }

    if (organization.status === 'INACTIVE') {
      throw new InactiveOrganizationError(id);
    }

    organization.setStatus('INACTIVE');
    await this.organizationRepository.update(organization);

    return organization;
  }
}
