import { SetMetadata } from '@nestjs/common';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

/** Metadata key read by {@link RolesGuard} to determine required roles. */
export const ROLES_KEY = 'roles';

/**
 * Restricts a route to users holding one of the specified {@link RoleName} values.
 * Developer accounts (`isDev = true`) bypass this check regardless of role.
 *
 * Usage: `@Roles(RoleName.ADMIN)`
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
