import { Injectable } from '@nestjs/common';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import {
  Membership,
  MembershipAlreadyExistsError,
  DriverNotFoundForMembershipError,
  UserNotFoundForMembershipError,
} from '../../domain/entities';
import { AssociateDriverDto } from '../dtos';

/**
 * Associates a driver to the caller's organization via email + CNH identity verification.
 *
 * Both identifiers must match the same user — this prevents an admin from linking
 * an arbitrary person without knowing their CNH. Behaves like {@link CreateMembershipUseCase}
 * for the membership persistence step (create or restore soft-deleted).
 */
@Injectable()
export class AssociateDriverToOrganizationUseCase {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly userRepository: UserRepository,
    private readonly driverRepository: DriverRepository,
    private readonly roleRepository: RoleRepository,
    private readonly planLimitService: PlanLimitService,
  ) {}

  /**
   * Verifies identity via email + CNH, enforces plan limits, then creates or restores
   * the DRIVER membership for the caller's organization.
   *
   * @param dto - `{ userEmail, cnh }` supplied by the admin
   * @param tenantOrganizationId - UUID of the admin's organization (from JWT)
   * @returns The created or restored {@link Membership}
   * @throws {@link UserNotFoundForMembershipError} if no user matches `userEmail`
   * @throws {@link DriverNotFoundForMembershipError} if no driver matches `cnh` or CNH belongs to a different user
   * @throws {@link MembershipAlreadyExistsError} if an active DRIVER membership already exists
   */
  async execute(
    dto: AssociateDriverDto,
    tenantOrganizationId: string,
  ): Promise<Membership> {
    const user = await this.userRepository.findByEmail(dto.userEmail);
    if (!user) {
      throw new UserNotFoundForMembershipError(dto.userEmail);
    }

    const driver = await this.driverRepository.findByCnh(dto.cnh);
    if (!driver || driver.userId !== user.id) {
      throw new DriverNotFoundForMembershipError(dto.userEmail);
    }

    const role = await this.roleRepository.findByName(RoleName.DRIVER);
    const roleId = role!.id;

    const activeDriverCount =
      await this.driverRepository.countActiveByOrganizationId(
        tenantOrganizationId,
      );
    await this.planLimitService.assertDriverLimit(
      tenantOrganizationId,
      activeDriverCount,
    );

    const membershipExists = await this.membershipRepository.findByCompositeKey(
      user.id,
      roleId,
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
              roleId,
              tenantOrganizationId,
            );
          }
          throw error;
        }
        return membershipExists;
      }

      throw new MembershipAlreadyExistsError(
        user.id,
        roleId,
        tenantOrganizationId,
      );
    }

    const membership = Membership.create({
      userId: user.id,
      roleId,
      organizationId: tenantOrganizationId,
    });

    try {
      await this.membershipRepository.save(membership);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new MembershipAlreadyExistsError(
          user.id,
          roleId,
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
