import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases';
import { CreateMembershipUseCase } from '../../../membership/application/use-cases';
import { SubscribeToPlanUseCase } from '../../../subscriptions/application/use-cases';
import { PlanRepository } from '../../../plans/domain/interfaces/plan.repository';
import { PlanName } from '../../../plans/domain/interfaces/enums/plan-name.enum';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { RegisterOrganizationWithAdminDto } from '../dtos/register-organization.dto';
import { TokenResponseDto } from '../dtos';
import { TransactionManager } from 'src/shared/infrastructure/database/transaction-manager';

/**
 * Atomically registers a new user, an organization, and an `ADMIN` membership
 * linking them, then returns enriched JWT tokens.
 *
 * @remarks
 * Compensation pattern:
 * - If organization creation fails → the user row is deleted.
 * - If membership creation fails → the user row AND the organization row are deleted.
 *
 * Throws:
 * - `UserEmailAlreadyExistsError` — email already taken
 * - `OrganizationAlreadyExistsError` — CNPJ already registered
 * - {@link RoleNotFoundError} — `ADMIN` role missing from seed data
 */
@Injectable()
export class RegisterOrganizationWithAdminUseCase {
  private readonly logger = new Logger(
    RegisterOrganizationWithAdminUseCase.name,
  );

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly createMembershipUseCase: CreateMembershipUseCase,
    private readonly roleRepository: RoleRepository,
    private readonly jwtService: JwtService,
    private readonly jwtPayloadService: JwtPayloadService,
    private readonly transactionManager: TransactionManager,
    private readonly subscribeToPlanUseCase: SubscribeToPlanUseCase,
    private readonly planRepository: PlanRepository,
  ) {}

  /**
   * Registers a new user + organization in a single transaction, linking them as ADMIN.
   * Compensates (deletes user) if organization or membership creation fails.
   * @param dto - User and organization registration data
   * @returns TokenResponseDto with enriched JWT tokens and user info
   * @throws UserEmailAlreadyExistsError if user email is already taken
   * @throws OrganizationAlreadyExistsError if CNPJ is already registered
   * @throws RoleNotFoundError if ADMIN role does not exist in the system
   */
  async execute(
    dto: RegisterOrganizationWithAdminDto,
  ): Promise<TokenResponseDto> {
    const { user, organization } =
      await this.transactionManager.runInTransaction(async () => {
        const user = await this.createUserUseCase.execute({
          name: dto.userName,
          email: dto.userEmail,
          password: dto.userPassword,
          telephone: dto.userTelephone,
        });

        const organization = await this.createOrganizationUseCase.execute({
          name: dto.organizationName,
          cnpj: dto.cnpj,
          email: dto.organizationEmail,
          telephone: dto.organizationTelephone,
          address: dto.address,
          slug: dto.slug,
        });

        const adminRole = await this.roleRepository.findByName(RoleName.ADMIN);
        if (!adminRole) {
          throw new RoleNotFoundError('ADMIN role not found');
        }

        await this.createMembershipUseCase.execute(
          { userEmail: dto.userEmail, roleId: adminRole.id },
          organization.id,
        );

        return { user, organization };
      });

    // Auto-subscribe to the FREE plan outside the main transaction to avoid
    // nesting a Serializable transaction inside the parent transaction.
    // Failure is non-fatal: the org is created; the admin can subscribe manually.
    const freePlan = await this.planRepository.findByName(PlanName.FREE);
    if (freePlan) {
      try {
        await this.subscribeToPlanUseCase.execute(
          { planId: freePlan.id },
          organization.id,
        );
        this.logger.log(
          `[RegisterOrg] Auto-subscribed org=${organization.id} to FREE plan`,
        );
      } catch (err) {
        this.logger.warn(
          `[RegisterOrg] Auto-subscribe FREE failed for org=${organization.id}: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.warn(
        '[RegisterOrg] FREE plan not found in database — run db:seed to fix this',
      );
    }

    // 4. Generate JWT directly (no re-authentication needed)
    const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);
    const accessToken = this.jwtService.sign(enrichedPayload);
    const refreshToken = this.jwtService.sign(enrichedPayload, {
      expiresIn: '7d',
    });

    this.logger.log(
      `[RegisterOrg] SUCCESS: userId=${user.id}, org=${enrichedPayload.organizationId}`,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
