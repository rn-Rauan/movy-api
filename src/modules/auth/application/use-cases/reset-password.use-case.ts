import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { hashToken } from '../../domain/entities/password-reset-token.entity';
import { InvalidOrExpiredResetTokenError } from '../../domain/errors/auth.errors';
import { PasswordResetTokenRepository } from '../../domain/interfaces/password-reset-token.repository';
import { RefreshTokenRepository } from '../../domain/interfaces/refresh-token-repository.interface';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { JwtPayloadService } from '../services/jwt-payload.service';

/**
 * Completes the password-reset flow.
 *
 * Steps:
 * 1. Hashes the incoming raw token and resolves the corresponding {@link PasswordResetToken}.
 *    Missing / expired / used tokens all return {@link InvalidOrExpiredResetTokenError}
 *    (uniform 400) to avoid leaking token-state information.
 * 2. Verifies the linked user is still ACTIVE — otherwise rejects with the same error
 *    (do not signal account state via reset endpoint).
 * 3. Updates the user's password hash and stamps the token as used.
 * 4. **Revokes all refresh tokens** for the user — if the reset was triggered by an
 *    account takeover, this kicks the attacker out of any active sessions.
 * 5. Issues a fresh access/refresh pair (auto-login) so the FE doesn't need to ask
 *    for credentials again right after the reset.
 */
@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtPayloadService: JwtPayloadService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    rawToken: string,
    newPassword: string,
  ): Promise<TokenResponseDto> {
    const token = await this.tokenRepository.findByTokenHash(
      hashToken(rawToken),
    );
    if (!token || !token.isValid()) {
      throw new InvalidOrExpiredResetTokenError();
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user || user.status === 'INACTIVE') {
      throw new InvalidOrExpiredResetTokenError();
    }

    const newPasswordHash = await this.hashProvider.generateHash(newPassword);
    user.setPasswordHash(newPasswordHash);
    await this.userRepository.update(user);

    await this.tokenRepository.markUsed(token.id);
    await this.refreshTokenRepository.deleteByUserId(user.id);

    const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);
    const jti = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const accessToken = this.jwtService.sign(enrichedPayload);
    const refreshToken = this.jwtService.sign(
      { ...enrichedPayload, jti },
      { expiresIn: '7d' },
    );
    await this.refreshTokenRepository.save(jti, user.id, refreshExpiresAt);

    this.logger.log(`[ResetPassword] SUCCESS userId=${user.id}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  }
}
