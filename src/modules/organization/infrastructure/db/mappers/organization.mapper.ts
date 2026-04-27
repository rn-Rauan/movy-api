import { Organization as PrismaOrganization } from 'generated/prisma/client';
import { Organization } from 'src/modules/organization/domain/entities';
import {
  Cnpj,
  Slug,
  OrganizationName,
  Address,
} from 'src/modules/organization/domain/entities/value-objects';
import { Telephone, Email } from 'src/shared/domain/entities/value-objects';
/**
 * Bidirectional mapper between the Prisma `Organization` model and the {@link Organization} domain object.
 *
 * Reconstructs all Value Objects (`OrganizationName`, `Cnpj`, `Email`, `Telephone`,
 * `Slug`, `Address`) from their persisted string representations. Contains no business logic.
 */
export class OrganizationMapper {
  /**
   * Converts a raw Prisma `Organization` record to an {@link Organization} domain object.
   *
   * @param raw - Raw `Organization` record returned by the Prisma client
   * @returns A fully hydrated {@link Organization} instance
   */
  static toDomain(raw: PrismaOrganization): Organization {
    return Organization.restore({
      id: raw.id,
      name: OrganizationName.create(raw.name),
      cnpj: Cnpj.create(raw.cnpj),
      email: Email.restore(raw.email),
      telephone: Telephone.restore(raw.telephone),
      slug: Slug.create(raw.slug),
      address: Address.create(raw.address),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts an {@link Organization} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param organization - The {@link Organization} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.organization.create({ data })`
   */
  static toPersistence(organization: Organization): PrismaOrganization {
    return {
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
    };
  }
}
