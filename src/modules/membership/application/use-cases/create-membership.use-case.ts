import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import {
  Membership,
  MembershipAlreadyExistsError,
  UserNotFoundForMembershipError,
  MembershipMissingIdentifierError,
} from '../../domain/entities';

@Injectable()
export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: CreateMembershipDto): Promise<Membership> {
    let userId = dto.userId;

    if (!userId && dto.userEmail) {
      const user = await this.userRepository.findByEmail(dto.userEmail);
      if (!user) {
        throw new UserNotFoundForMembershipError(dto.userEmail);
      }
      userId = user.id;
    }

    if (!userId) {
      throw new MembershipMissingIdentifierError();
    }

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      userId,
      dto.roleId,
      dto.organizationId,
    );

    if (membershipExists) {
      // If soft-deleted, reactivate instead of throwing error
      if (membershipExists.removedAt !== null) {
        membershipExists.restore_membership();
        await this.membershipRepository.update(membershipExists);
        return membershipExists;
      }

      throw new MembershipAlreadyExistsError(
        userId,
        dto.roleId,
        dto.organizationId,
      );
    }

    const membership = Membership.create({
      userId: userId,
      roleId: dto.roleId,
      organizationId: dto.organizationId,
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
