import { OrganizationResponseDto } from '../../application/dtos/organization-response.dto';
import { Organization } from '../../domain/entities';

/**
 * Serialises an {@link Organization} domain object into the HTTP response shape
 * {@link OrganizationResponseDto}.
 *
 * @remarks
 * Instantiated as a NestJS provider (not static) so it can be injected into
 * the controller via DI. Should be called exclusively from controller methods.
 */
export class OrganizationPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param organization - The {@link Organization} to serialise
   * @returns An {@link OrganizationResponseDto} safe to include in an HTTP response
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
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param organizations - Array of {@link Organization} instances to serialise
   * @returns Array of {@link OrganizationResponseDto} objects
   */
  toListHTTP(organizations: Organization[]): OrganizationResponseDto[] {
    return organizations.map((organization) => this.toHTTP(organization));
  }
}
