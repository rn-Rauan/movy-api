import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserOrganizationRoleResolver } from '../domain/interfaces/user-organization-role.resolver';
import { InsufficientPermissionError } from '../domain/errors/roles.error';
import { RoleName } from '../domain/types/role-name.enum';
import { ROLES_KEY } from '../infrastructure/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    private readonly userOrgRoleResolver?: UserOrganizationRoleResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!this.userOrgRoleResolver) {
      throw new Error(
        'RolesGuard requires UserOrganizationRoleResolver to be provided. ' +
          'Make sure MembershipModule is imported in your application.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const organizationId = request.params.organizationId || request.params.id;

    if (!user || !organizationId) {
      // This should technically be caught by AuthGuard or other validation,
      // but as a safeguard:
      throw new InsufficientPermissionError(requiredRoles);
    }

    try {
      const userRole =
        await this.userOrgRoleResolver.resolveUserRoleInOrganization(
          user.id,
          organizationId,
        );

      const hasPermission = requiredRoles.some(
        (role) => userRole.name === role,
      );

      if (!hasPermission) {
        throw new InsufficientPermissionError(requiredRoles);
      }

      return true;
    } catch (error) {
      // If the resolver throws an error (e.g., MembershipNotFound),
      // it means the user isn't part of the org, so they don't have the role.
      // We translate this to an InsufficientPermissionError.
      if (error instanceof InsufficientPermissionError) {
        throw error;
      }
      throw new InsufficientPermissionError(requiredRoles);
    }
  }
}
