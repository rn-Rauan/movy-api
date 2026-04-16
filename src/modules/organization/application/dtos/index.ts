export { CreateOrganizationDto } from './create-organization.dto';
export { OrganizationResponseDto } from './organization-response.dto';
export { UpdateOrganizationDto } from './update-organization.dto';

/**
 * Tenant context parameters for multi-tenant access validation.
 * @param tenantOrganizationId - ID of the authenticated tenant's organization
 * @param isDev - Whether the user is a developer (bypass tenant restrictions)
 */
export interface TenantContextParams {
  tenantOrganizationId?: string;
  isDev: boolean;
}
