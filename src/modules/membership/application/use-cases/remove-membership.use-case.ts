import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { MembershipNotFoundError } from '../../domain/entities';

/**
 * Soft-removes a membership by stamping `removedAt` with the current timestamp.
 *
 * @remarks
 * Throws {@link MembershipNotFoundError} if no membership exists for the composite key.
 * Does NOT hard-delete the record — use `MembershipRepository.delete` for that.
 */
@Injectable()
export class RemoveMembershipUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  /**
   * Remove a membership for a user within an organization.
   * @param userId - UUID of the user to remove the membership for
   * @param roleId - ID of the role assigned to the user within the organization
   * @param organizationId - UUID of the organization to remove the membership from
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

    membership.remove();
    await this.membershipRepository.update(membership);
  }
}
