import type { RegisterOrganizationWithAdminDto } from 'src/modules/auth/application/dtos/register-organization.dto';

interface RegisterOrgDtoOverrides {
  userName?: string;
  userEmail?: string;
  userPassword?: string;
  userTelephone?: string;
  organizationName?: string;
  cnpj?: string;
  organizationEmail?: string;
  organizationTelephone?: string;
  address?: string;
  slug?: string;
}

export function makeRegisterOrgDto(
  overrides: RegisterOrgDtoOverrides = {},
): RegisterOrganizationWithAdminDto {
  return {
    userName: overrides.userName ?? 'Admin Stub',
    userEmail: overrides.userEmail ?? 'admin@stub.com',
    userPassword: overrides.userPassword ?? 'password123',
    userTelephone: overrides.userTelephone ?? '9999999999',
    organizationName: overrides.organizationName ?? 'Stub Org',
    cnpj: overrides.cnpj ?? '11222333000181',
    organizationEmail: overrides.organizationEmail ?? 'org@stub.com',
    organizationTelephone: overrides.organizationTelephone ?? '9999999999',
    address: overrides.address ?? 'Rua Stub, 123',
    slug: overrides.slug ?? 'stub-org',
  };
}
