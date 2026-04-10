import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { TokenResponseDto } from '../dtos';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly jwtPayloadService: JwtPayloadService,
  ) {}

  async execute(refreshToken: string): Promise<TokenResponseDto> {
    try {
      this.logger.debug(`[Refresh Token] Attempting to refresh token`);

      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findById(payload.sub);

      if (!user || user.status === 'INACTIVE') {
        this.logger.warn(
          `[Refresh Token] Invalid user or inactive: ${payload.sub}`,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ✅ NOVO: Enriquecer payload novamente
      this.logger.debug(
        `[Refresh Token] Enriching JWT payload for userId: ${user.id}`,
      );
      const enrichedPayload = await this.jwtPayloadService.enrichPayload(
        user.id,
      );

      const accessToken = this.jwtService.sign(enrichedPayload);
      const newRefreshToken = this.jwtService.sign(enrichedPayload, {
        expiresIn: '7d',
      });

      this.logger.log(
        `[Refresh Token] ✅ SUCCESS: userId=${user.id}, org=${enrichedPayload.organizationId || 'B2C'}`,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
