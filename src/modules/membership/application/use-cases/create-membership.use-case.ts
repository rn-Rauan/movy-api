import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import {
  Membership,
  MembershipAlreadyExistsError,
} from '../../domain/entities';

@Injectable()
export class CreateMembershipUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(dto: CreateMembershipDto): Promise<Membership> {
    const membershipExists = await this.membershipRepository.findByCompositeKey(
      dto.userId,
      dto.roleId,
      dto.organizationId,
    );

    if (membershipExists) {
      throw new MembershipAlreadyExistsError(
        dto.userId,
        dto.roleId,
        dto.organizationId,
      );
    }

    const membership = Membership.create({
      userId: dto.userId,
      roleId: dto.roleId,
      organizationId: dto.organizationId,
    });

    await this.membershipRepository.save(membership);
    return membership;
  }
}
