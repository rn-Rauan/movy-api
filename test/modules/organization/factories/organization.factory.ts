import { Organization } from 'src/modules/organization/domain/entities';
import {
    Address,
    Cnpj,
    OrganizationName,
    Slug,
} from 'src/modules/organization/domain/entities/value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';

interface OrganizationFactoryOverrides {
    id?: string;
    name?: string;
    cnpj?: string;
    email?: string;
    telephone?: string;
    address?: string;
    slug?: string;
}

export function makeOrganization(overrides: OrganizationFactoryOverrides = {}): Organization {
    return Organization.create({
        id: overrides.id ?? 'org-id-stub',
        name: OrganizationName.create(overrides.name ?? 'Stub Org'),
        cnpj: Cnpj.create(overrides.cnpj ?? '11222333000181'),
        email: Email.create(overrides.email ?? 'org@stub.com'),
        telephone: Telephone.create(overrides.telephone ?? '9999999999'),
        address: Address.create(overrides.address ?? 'Rua Stub, 123'),
        slug: Slug.create(overrides.slug ?? 'stub-org'),
    });
}
