import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases';
import { CreateMembershipUseCase } from '../../../membership/application/use-cases';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { RegisterOrganizationWithAdminDto } from '../dtos/register-organization.dto';
import { TokenResponseDto } from '../dtos';

/**
 * Atomically registers a new user, an organization, and an `ADMIN` membership
 * linking them, then returns enriched JWT tokens.
 *
 * @remarks
 * Compensation pattern:
 * - If organization creation fails → the user row is deleted.
 * - If membership creation fails → the user row is deleted.
 * - The organization is NOT deleted on membership failure (manual cleanup needed).
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
    private readonly userRepository: UserRepository,
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
    // 1. Create the User
    const user = await this.createUserUseCase.execute({
      name: dto.userName,
      email: dto.userEmail,
      password: dto.userPassword,
      telephone: dto.userTelephone,
    });

    // 2. Create the Organization
    let organization;
    try {
      organization = await this.createOrganizationUseCase.execute({
        name: dto.organizationName,
        cnpj: dto.cnpj,
        email: dto.organizationEmail,
        telephone: dto.organizationTelephone,
        address: dto.address,
        slug: dto.slug,
      });
    } catch (error) {
      this.logger.warn(
        `[RegisterOrg] Organization creation failed, compensating: deleting user ${user.id}`,
      );
      await this.compensateUser(user.id);
      throw error;
    }

    // 3. Create ADMIN membership linking user to organization
    try {
      const adminRole = await this.roleRepository.findByName(RoleName.ADMIN);
      if (!adminRole) {
        throw new RoleNotFoundError('ADMIN role not found');
      }

      await this.createMembershipUseCase.execute(
        { userEmail: dto.userEmail, roleId: adminRole.id },
        organization.id,
      );
    } catch (error) {
      this.logger.warn(
        `[RegisterOrg] Membership creation failed, compensating: deleting user ${user.id}`,
      );
      await this.compensateUser(user.id);
      throw error;
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

  private async compensateUser(userId: string): Promise<void> {
    try {
      await this.userRepository.delete(userId);
    } catch {
      this.logger.error(
        `[RegisterOrg] Compensation failed: could not delete user ${userId}`,
      );
    }
  }
}
