import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases';
import { CreateMembershipUseCase } from '../../../membership/application/use-cases';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { RoleName } from 'src/shared/domain/types/role-name.enum';
import { RoleNotFoundError } from 'src/shared/domain/errors/roles.error';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { SetupOrganizationDto } from '../dtos/setup-organization.dto';
import { TokenResponseDto } from '../dtos';

@Injectable()
export class SetupOrganizationForExistingUserUseCase {
  private readonly logger = new Logger(
    SetupOrganizationForExistingUserUseCase.name,
  );

  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly createMembershipUseCase: CreateMembershipUseCase,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly jwtPayloadService: JwtPayloadService,
  ) {}

  /**
   * Creates an organization for an already authenticated user and links them as ADMIN.
   * Re-issues JWT with the new organization context.
   * @param dto - Organization setup data (name, CNPJ, email, telephone, address, slug)
   * @param userId - UUID of the authenticated user
   * @returns TokenResponseDto with enriched JWT tokens and user info
   * @throws Error if user does not exist or is inactive
   * @throws OrganizationAlreadyExistsError if CNPJ is already registered
   * @throws RoleNotFoundError if ADMIN role does not exist in the system
   */
  async execute(
    dto: SetupOrganizationDto,
    userId: string,
  ): Promise<TokenResponseDto> {
    // 1. Confirm user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user || user.status === 'INACTIVE') {
      throw new Error('User not found or inactive');
    }

    // 2. Create the Organization
    const organization = await this.createOrganizationUseCase.execute({
      name: dto.organizationName,
      cnpj: dto.cnpj,
      email: dto.organizationEmail,
      telephone: dto.organizationTelephone,
      address: dto.address,
      slug: dto.slug,
    });

    // 3. Create ADMIN membership linking user to organization
    // If membership fails, org is left without an admin — compensate by removing org
    try {
      const adminRole = await this.roleRepository.findByName(RoleName.ADMIN);
      if (!adminRole) {
        throw new RoleNotFoundError('ADMIN role not found');
      }

      await this.createMembershipUseCase.execute(
        { userEmail: user.email, roleId: adminRole.id },
        organization.id,
      );
    } catch (error) {
      this.logger.warn(
        `[SetupOrg] Membership creation failed for user ${userId}, org ${organization.id} left orphan — manual cleanup may be needed`,
      );
      throw error;
    }

    // 4. Re-issue JWT with the new organization context
    const enrichedPayload = await this.jwtPayloadService.enrichPayload(userId);
    const accessToken = this.jwtService.sign(enrichedPayload);
    const refreshToken = this.jwtService.sign(enrichedPayload, {
      expiresIn: '7d',
    });

    this.logger.log(
      `[SetupOrg] SUCCESS: userId=${userId}, org=${enrichedPayload.organizationId}`,
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
