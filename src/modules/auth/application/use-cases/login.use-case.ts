import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { LoginDto, TokenResponseDto } from '../dtos';
import { UserNotFoundError } from '../../../user/domain/entities/errors/user.errors';

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtService: JwtService,
    private readonly jwtPayloadService: JwtPayloadService,
  ) {}

  async execute(loginDto: LoginDto): Promise<TokenResponseDto> {
    this.logger.log(`[Login] Attempt for email: ${loginDto.email}`);

    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`[Login] User not found: ${loginDto.email}`);
      throw new UserNotFoundError(loginDto.email);
    }

    if (user.status === 'INACTIVE') {
      this.logger.warn(`[Login] User inactive: ${user.id}`);
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.hashProvider.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`[Login] Invalid password for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ NOVO: Enriquecer payload (não apenas { sub, email })
    this.logger.debug(`[Login] Enriching JWT payload for userId: ${user.id}`);
    const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);

    // Assinar JWTs com payload enriquecido
    const accessToken = this.jwtService.sign(enrichedPayload);
    const refreshToken = this.jwtService.sign(enrichedPayload, {
      expiresIn: '7d',
    });

    this.logger.log(
      `[Login] SUCCESS: userId=${user.id}, org=${enrichedPayload.organizationId || 'B2C'}, role=${enrichedPayload.role || 'none'}, isDev=${enrichedPayload.isDev}`,
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
