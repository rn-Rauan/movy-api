import { Injectable } from '@nestjs/common';
import { UserOrganizationRoleResolver } from 'src/shared/domain/interfaces/user-organization-role.resolver';
import { Role } from 'src/shared/domain/entities/role.entity';
import { FindRoleByUserIdAndOrganizationIdUseCase } from '../../application/use-cases/find-role-by-user-and-organization.use-case';

/**
 * Implementation of UserOrganizationRoleResolver for the Membership module.
 * Resolves a user's role within an organization by delegating to the use case.
 */
@Injectable()
export class MembershipUserOrgRoleResolver extends UserOrganizationRoleResolver {
  constructor(
    private readonly findRoleUseCase: FindRoleByUserIdAndOrganizationIdUseCase,
  ) {
    super();
  }

  async resolveUserRoleInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<Role> {
    return this.findRoleUseCase.execute({ userId, organizationId });
  }
}
