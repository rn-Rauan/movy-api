import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { MembershipNotFoundError } from '../../domain/entities';

@Injectable()
export class RestoreMembershipUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

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

    membership.restore_membership();
    await this.membershipRepository.update(membership);
  }
}
