import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '../dtos';
import { OrganizationName, Cnpj, Slug, Address, Organization, OrganizationAlreadyExistsError,} from '../../domain/entities';
import { Telephone, Email } from 'src/shared/domain/entities/value-objects';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Creates a new organization in the system.
   * @param organizationDto - Data for organization creation
   * @returns Organization entity created and persisted
   * @throws OrganizationAlreadyExistsError if the CNPJ already already exists or if the slug already exists
   */
  async execute(organizationDto: CreateOrganizationDto): Promise<Organization> {
    const organizationExists = await this.organizationRepository.findByCnpj(
      organizationDto.cnpj,
    );
    if (organizationExists) {
      throw new OrganizationAlreadyExistsError(organizationDto.cnpj);
    }

    const slugExists = await this.organizationRepository.findBySlug(
      organizationDto.slug,
    );
    if (slugExists) {
      throw new OrganizationAlreadyExistsError(
        `Slug '${organizationDto.slug}' already exists`,
      );
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

    return organization;
  }
}
