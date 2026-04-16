import { SetupOrganizationDto } from 'src/modules/auth/application/dtos/setup-organization.dto';

type SetupOrgDtoOverrides = Partial<SetupOrganizationDto>;

export function makeSetupOrgDto(
  overrides: SetupOrgDtoOverrides = {},
): SetupOrganizationDto {
  return {
    organizationName: overrides.organizationName ?? 'Stub Transportes',
    cnpj: overrides.cnpj ?? '11222333000181',
    organizationEmail: overrides.organizationEmail ?? 'org@stub.com',
    organizationTelephone: overrides.organizationTelephone ?? '11999990000',
    address: overrides.address ?? 'Rua Stub 123',
    slug: overrides.slug ?? 'stub-transportes',
  };
}
