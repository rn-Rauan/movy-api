import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from 'src/modules/auth/domain/interfaces/refresh-token-repository.interface';
import type { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * Revokes a refresh token, effectively logging the user out of the current session.
 *
 * @remarks
 * The operation is intentionally **idempotent**:
 * - An invalid or already-expired token is silently ignored (no exception thrown).
 * - A token whose `jti` is already absent from the store is also silently ignored.
 * - Legacy tokens issued before the JTI feature was added (no `jti` claim) are
 *   accepted without error — the client is expected to discard them locally.
 *
 * After a successful logout, any attempt to call `POST /auth/refresh` with the
 * same token will be rejected with `401 Unauthorized` by {@link RefreshTokenUseCase}.
 * The corresponding access token remains valid until its 1-hour natural expiry.
 */
@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Revokes the given refresh token by deleting its JTI from the store.
   *
   * @param refreshToken - The raw refresh token string to revoke
   */
  async execute(refreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      // Token invalid or expired — treat as already logged out (idempotent)
      this.logger.debug('[Logout] Invalid or expired token; treating as no-op');
      return;
    }

    if (!payload.jti) {
      // Legacy token without JTI — nothing to revoke
      return;
    }

    await this.refreshTokenRepository.deleteByJti(payload.jti);
    this.logger.log(
      `[Logout] Revoked refresh token jti=${payload.jti} for userId=${payload.sub}`,
    );
  }
}
