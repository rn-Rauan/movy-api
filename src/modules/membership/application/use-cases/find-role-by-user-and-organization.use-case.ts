import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { MembershipNotFoundError } from '../../domain/entities';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';

interface Input {
  userId: string;
  organizationId: string;
}

@Injectable()
export class FindRoleByUserIdAndOrganizationIdUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  /**
   * Find the role assigned to a user within an organization.
   * @param userId - UUID of the user to search for the role
   * @param organizationId - UUID of the organization to search for the role
   * @throws MembershipNotFoundError if no membership is found with the given user and organization
   * @throws RoleNotFoundError if the role associated with the membership is not found
   * @returns Role entity found by user and organization
   */
  async execute({ userId, organizationId }: Input): Promise<Role> {
    const membership =
      await this.membershipRepository.findByUserIdAndOrganizationId(
        userId,
        organizationId,
      );

    if (!membership) {
      throw new MembershipNotFoundError(userId, undefined, organizationId);
    }

    const role = await this.roleRepository.findById(membership.roleId);
    if (!role) {
      throw new RoleNotFoundError(membership.roleId);
    }
    return role;
  }
}
