import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '../dtos';
import {
  Organization,
  OrganizationAlreadyExistsError,
} from '../../domain/entities';
import { OrganizationName, Cnpj, Slug, Address } from '../../domain/entities';
import { Telephone, Email } from 'src/shared/domain/entities/value-objects';
import { MembershipRepository } from 'src/modules/membership/domain/interfaces/membership.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { Membership } from 'src/modules/membership/domain/entities/membership.entity';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(
    organizationDto: CreateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const organizationExists = await this.organizationRepository.findByCnpj(
      organizationDto.cnpj,
    );
    if (organizationExists) {
      throw new OrganizationAlreadyExistsError(organizationDto.cnpj);
    }

    const adminRole = await this.roleRepository.findByName(RoleName.ADMIN);
    if (!adminRole) {
      throw new RoleNotFoundError('ADMIN role not found');
    }

    const id = crypto.randomUUID();

    const organization = Organization.create({
      id: id,
      name: OrganizationName.create(organizationDto.name),
      cnpj: Cnpj.create(organizationDto.cnpj),
      address: Address.create(organizationDto.address),
      email: Email.create(organizationDto.email),
      telephone: Telephone.create(organizationDto.telephone),
      slug: Slug.create(organizationDto.slug),
    });

    await this.organizationRepository.save(organization);

    // Automaticaly create ADMIN membership for the user
    const membership = Membership.create({
      userId: userId,
      organizationId: organization.id,
      roleId: adminRole.id,
    });

    await this.membershipRepository.save(membership);

    return organization;
  }
}
