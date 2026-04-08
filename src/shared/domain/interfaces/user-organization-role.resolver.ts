import { Role } from '../entities/role.entity';

/**
 * Abstraction for resolving a user's role within an organization.
 * Implemented by MembershipModule to avoid circular dependencies.
 */
export abstract class UserOrganizationRoleResolver {
  abstract resolveUserRoleInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Role>;
}
