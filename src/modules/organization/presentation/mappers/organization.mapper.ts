import { OrganizationResponseDto } from '../../application/dtos/organization-response.dto';
import { Organization } from '../../domain/entities';

export class OrganizationPresenter {
  /**
   * Maps an Organization entity to HTTP response DTO for API consumption.
   * @param organization - Organization entity from the domain
   * @returns OrganizationResponseDto formatted for the API
   */
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

  /**
   * Maps a list of Organization entities to HTTP response DTOs for API consumption.
   * @param organizations - Array of Organization entities from the domain
   * @returns Array of OrganizationResponseDto formatted for the API
   */
  toListHTTP(organizations: Organization[]): OrganizationResponseDto[] {
    return organizations.map((organization) => this.toHTTP(organization));
  }
}
