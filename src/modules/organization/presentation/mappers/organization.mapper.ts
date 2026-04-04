import { OrganizationResponseDto } from '../../application/dtos/organization-response.dto';
import { Organization } from '../../domain/entities';

export class OrganizationPresenter {
  toHTTP(organization: Organization): OrganizationResponseDto {
    return new OrganizationResponseDto({
      id: organization.id,
      name: organization.name,
      cnpj: organization.cnpj,
      email: organization.email,
      telephone: organization.telephone,
      slug: organization.slug,
      address: organization.address,
      status: organization.status,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    });
  }
  toListHTTP(organizations: Organization[]): OrganizationResponseDto[] {
    return organizations.map((organization) => this.toHTTP(organization));
  }
}
