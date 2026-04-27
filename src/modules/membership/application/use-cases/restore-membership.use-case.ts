import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { MembershipNotFoundError } from '../../domain/entities';

/**
 * Restores a previously soft-removed membership by clearing `removedAt`.
 *
 * @remarks
 * Throws {@link MembershipNotFoundError} if no membership exists for the composite key.
 * Idempotent if the membership is already active (`removedAt === null`).
 */
@Injectable()
export class RestoreMembershipUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  /**
   * Restore a membership for a user within an organization.
   * @param userId - UUID of the user to restore the membership for
   * @param roleId - ID of the role assigned to the user within the organization
   * @param organizationId - UUID of the organization to restore the membership from
   * @throws MembershipNotFoundError if no membership is found with the given composite key
   * @returns void
   */
  async execute(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.membershipRepository.findByCompositeKey(
      userId,
      roleId,
      organizationId,
    );

    if (!membership) {
      throw new MembershipNotFoundError(userId, roleId, organizationId);
    }

    membership.restoreMembership();
    await this.membershipRepository.update(membership);
  }
}
