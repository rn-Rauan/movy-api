import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from '../dtos';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import {
  Membership,
  MembershipAlreadyExistsError,
  UserNotFoundForMembershipError,
  DriverNotFoundForMembershipError,
} from '../../domain/entities';

/**
 * Creates a membership between a user, a role, and the caller's organization.
 *
 * @remarks
 * Resolution order:
 * 1. Resolves the user by `userEmail` — throws {@link UserNotFoundForMembershipError} if absent.
 * 2. If the target role is `DRIVER`, validates the user has a driver profile —
 *    throws {@link DriverNotFoundForMembershipError} otherwise.
 * 3. Checks for an existing membership via composite key:
 *    - If found and previously removed (`removedAt !== null`), auto-restores it.
 *    - If found and active, throws {@link MembershipAlreadyExistsError}.
 * 4. Otherwise creates and persists a new {@link Membership}.
 */
@Injectable()
export class CreateMembershipUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userRepository: UserRepository,
    private readonly driverRepository: DriverRepository,
    private readonly roleRepository: RoleRepository,
    private readonly planLimitService: PlanLimitService,
  ) {}

  /**
   * Create a new membership for a user in a tenant organization
   * @param dto The DTO containing userEmail and roleId (1: ADMIN, 2: DRIVER)
   * @param tenantOrganizationId The ID of the tenant organization
   * @throws UserNotFoundForMembershipError if the user with the given email does not exist
   * @throws DriverNotFoundForMembershipError if the role is DRIVER and the user is not a driver
   * @throws MembershipAlreadyExistsError if a membership with the same user, role, and organization already exists
   * @returns The created membership entity
   */
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

      const activeDriverCount =
        await this.driverRepository.countActiveByOrganizationId(
          tenantOrganizationId,
        );
      await this.planLimitService.assertDriverLimit(
        tenantOrganizationId,
        activeDriverCount,
      );
    }

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      user.id,
      dto.roleId,
      tenantOrganizationId,
    );

    if (membershipExists) {
      if (membershipExists.removedAt !== null) {
        membershipExists.restoreMembership();
        try {
          await this.membershipRepository.update(membershipExists);
        } catch (error: unknown) {
          if (this.isUniqueConstraintViolation(error)) {
            throw new MembershipAlreadyExistsError(
              user.id,
              dto.roleId,
              tenantOrganizationId,
            );
          }
          throw error;
        }
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

    try {
      await this.membershipRepository.save(membership);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new MembershipAlreadyExistsError(
          user.id,
          dto.roleId,
          tenantOrganizationId,
        );
      }
      throw error;
    }
    return membership;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    if (!('code' in error)) return false;
    return (error as { code?: unknown }).code === 'P2002';
  }
}
