import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { OrganizationNotFoundError } from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';

@Injectable()
export class FindOrganizationByIdUseCase {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization || organization.status === 'INACTIVE') {
      throw new OrganizationNotFoundError(id);
    }
    return organization;
  }
}
