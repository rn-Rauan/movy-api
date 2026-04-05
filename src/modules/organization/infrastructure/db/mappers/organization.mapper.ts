import { Organization as PrismaOrganization } from "generated/prisma/client";
import { Organization } from "src/modules/organization/domain/entities";
import { Cnpj, Slug, OrganizationName, Address } from "src/modules/organization/domain/entities/value-objects";
import { Telephone, Email } from "src/shared/domain/entities/value-objects";
export class OrganizationMapper {

    /**
     * Map PrismaOrganization to Organization domain entity
     * @param raw PrismaOrganization entity
     * @returns Organization domain entity
     */
    static toDomain(raw: PrismaOrganization): Organization {
        return Organization.restore({
            id: raw.id,
            name: OrganizationName.create(raw.name),
            cnpj: Cnpj.create(raw.cnpj),
            email: Email.create(raw.email),
            telephone: Telephone.create(raw.telephone),
            slug: Slug.create(raw.slug),
            address: Address.create(raw.address),
            status: raw.status,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    /**
     * Map Organization domain entity to PrismaOrganization entity
     * @param organization Organization domain entity
     * @returns PrismaOrganization entity
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
        }
    }
}