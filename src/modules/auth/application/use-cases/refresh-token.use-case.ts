import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { TokenResponseDto } from '../dtos';
import type { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';
import { RefreshTokenRepository } from 'src/modules/auth/domain/interfaces/refresh-token-repository.interface';

/**
 * Rotates a JWT pair by validating an existing refresh token and issuing new ones.
 *
 * @remarks
 * Validation order:
 * 1. Verifies JWT signature and expiry — throws `UnauthorizedException` if invalid.
 * 2. If the token carries a `jti` claim, checks {@link RefreshTokenRepository}:
 *    absent JTI means the token was revoked (e.g. by {@link LogoutUseCase}) → 401.
 * 3. Confirms the user still exists and is `ACTIVE` in the database.
 * 4. Re-calls {@link JwtPayloadService.enrichPayload} so the new pair reflects
 *    any membership changes since the original login.
 * 5. Atomically rotates the JTI: deletes the old one and saves the new one.
 *
 * Tokens without a `jti` claim (issued before server-side revocation was added)
 * bypass the DB check and are validated by signature alone.
 */
@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly jwtPayloadService: JwtPayloadService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Refreshes JWT tokens using a valid refresh token.
   * @param refreshToken - Current refresh token string
   * @returns TokenResponseDto with new access token, refresh token, and user info
   * @throws UnauthorizedException if token is invalid, expired, or user is inactive
   */
  async execute(refreshToken: string): Promise<TokenResponseDto> {
    this.logger.debug(`[Refresh Token] Attempting to refresh token`);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.jti) {
      const stored = await this.refreshTokenRepository.findByJti(payload.jti);
      if (!stored) {
        this.logger.warn(
          `[Refresh Token] JTI not found or already revoked: ${payload.jti}`,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || user.status === 'INACTIVE') {
      this.logger.warn(
        `[Refresh Token] Invalid user or inactive: ${payload.sub}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.debug(
      `[Refresh Token] Enriching JWT payload for userId: ${user.id}`,
    );
    const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);

    const newJti = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (payload.jti) {
      await this.refreshTokenRepository.deleteByJti(payload.jti);
    }
    await this.refreshTokenRepository.save(newJti, user.id, refreshExpiresAt);

    const accessToken = this.jwtService.sign(enrichedPayload);
    const newRefreshToken = this.jwtService.sign(
      { ...enrichedPayload, jti: newJti },
      { expiresIn: '7d' },
    );

    this.logger.log(
      `[Refresh Token] SUCCESS: userId=${user.id}, org=${enrichedPayload.organizationId || 'B2C'}`,
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
  }
}
