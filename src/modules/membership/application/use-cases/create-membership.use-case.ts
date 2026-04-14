import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import {
  Membership,
  MembershipAlreadyExistsError,
  UserNotFoundForMembershipError,
} from '../../domain/entities';

@Injectable()
export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    dto: CreateMembershipDto,
    tenantOrganizationId: string,
  ): Promise<Membership> {
    const user = await this.userRepository.findByEmail(dto.userEmail);
    if (!user) {
      throw new UserNotFoundForMembershipError(dto.userEmail);
    }

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      user.id,
      dto.roleId,
      tenantOrganizationId,
    );

    if (membershipExists) {
      if (membershipExists.removedAt !== null) {
        membershipExists.restore_membership();
        await this.membershipRepository.update(membershipExists);
        return membershipExists;
      }

      throw new MembershipAlreadyExistsError(
        user.id,
        dto.roleId,
        tenantOrganizationId,
      );
    }

    const membership = Membership.create({
      userId: user.id,
      roleId: dto.roleId,
      organizationId: tenantOrganizationId,
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
