import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import {
  Membership,
  MembershipAlreadyExistsError,
  UserNotFoundForMembershipError,
  DriverNotFoundForMembershipError,
  DriverNotAssociatedWithOrganizationError,
} from '../../domain/entities';

@Injectable()
export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userRepository: UserRepository,
    private readonly driverRepository: DriverRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(
    dto: CreateMembershipDto,
    tenantOrganizationId: string,
  ): Promise<Membership> {
    const user = await this.userRepository.findByEmail(dto.userEmail);
    if (!user) {
      throw new UserNotFoundForMembershipError(dto.userEmail);
    }

    // Validate DRIVER prerequisites before any membership operation
    const role = await this.roleRepository.findById(dto.roleId);
    if (role && role.name === RoleName.DRIVER) {
      const driver = await this.driverRepository.findByUserId(user.id);
      if (!driver) {
        throw new DriverNotFoundForMembershipError(dto.userEmail);
      }
      if (driver.organizationId !== tenantOrganizationId) {
        throw new DriverNotAssociatedWithOrganizationError(
          dto.userEmail,
          tenantOrganizationId,
        );
      }
    }

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      user.id,
      dto.roleId,
      tenantOrganizationId,
    );

    if (membershipExists) {
      if (membershipExists.removedAt !== null) {
        membershipExists.restoreMembership();
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
