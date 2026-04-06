import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Membership, MembershipNotFoundError } from '../../domain/entities';

@Injectable()
export class FindMembershipByCompositeKeyUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

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
