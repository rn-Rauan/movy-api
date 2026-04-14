import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { CreateOrganizationUseCase } from '../../../organization/application/use-cases';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { RegisterOrganizationWithAdminDto } from '../dtos/register-organization.dto';
import { TokenResponseDto } from '../dtos';

@Injectable()
export class RegisterOrganizationWithAdminUseCase {
  private readonly logger = new Logger(RegisterOrganizationWithAdminUseCase.name);

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly jwtService: JwtService,
    private readonly jwtPayloadService: JwtPayloadService,
    private readonly userRepository: UserRepository,
  ) {}

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

    // 2. Create the Organization (also creates the ADMIN membership)
    // Compensating transaction: if org creation fails, rollback the user
    try {
      await this.createOrganizationUseCase.execute(
        {
          name: dto.organizationName,
          cnpj: dto.cnpj,
          email: dto.organizationEmail,
          telephone: dto.organizationTelephone,
          address: dto.address,
          slug: dto.slug,
        },
        user.id,
      );
    } catch (orgError) {
      this.logger.warn(
        `[RegisterOrg] Organization creation failed, compensating: deleting user ${user.id}`,
      );
      try {
        await this.userRepository.delete(user.id);
      } catch (deleteError) {
        this.logger.error(
          `[RegisterOrg] Compensation failed: could not delete user ${user.id}`,
        );
      }
      throw orgError;
    }

    // 3. Generate JWT directly (no re-authentication needed)
    const enrichedPayload = await this.jwtPayloadService.enrichPayload(
      user.id,
    );
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
