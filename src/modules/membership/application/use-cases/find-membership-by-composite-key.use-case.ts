import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Membership, MembershipNotFoundError } from '../../domain/entities';

/**
 * Retrieves a single membership by its composite key `(userId, roleId, organizationId)`.
 *
 * @remarks
 * Throws {@link MembershipNotFoundError} when no record matches the key.
 */
@Injectable()
export class FindMembershipByCompositeKeyUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  /**
   * @param userId - UUID of the user associated with the membership
   * @param roleId - ID of the role assigned to the user within the organization
   * @param organizationId - UUID of the organization to which the membership belongs
   * @returns Membership entity found by composite key
   * @throws MembershipNotFoundError if no membership is found with the given composite key
   */
  async execute(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership> {
    const membership = await this.membershipRepository.findByCompositeKey(
      userId,
      roleId,
      organizationId,
    );

    if (!membership) {
      throw new MembershipNotFoundError(userId, roleId, organizationId);
    }

    return membership;
  }
}
