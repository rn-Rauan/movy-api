import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import {
  Membership,
  MembershipAlreadyExistsError,
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
        throw new NotFoundException(
          `User with email ${dto.userEmail} not found`,
        );
      }
      userId = user.id;
    }

    if (!userId) {
      throw new BadRequestException('userId or userEmail must be provided');
    }

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      userId,
      dto.roleId,
      dto.organizationId,
    );

    if (membershipExists) {
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
