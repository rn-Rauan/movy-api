import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { hashToken } from '../../domain/entities/password-reset-token.entity';
import { InvalidOrExpiredVerificationTokenError } from '../../domain/errors/auth.errors';
import { EmailVerificationTokenRepository } from '../../domain/interfaces/email-verification-token.repository';

/**
 * Completes the email-verification flow.
 *
 * Steps:
 * 1. Hashes the raw token and resolves the matching {@link EmailVerificationToken}.
 *    Missing / expired / used tokens collapse into
 *    {@link InvalidOrExpiredVerificationTokenError} (400).
 * 2. Stamps {@link User.emailVerifiedAt} via the entity method and persists.
 * 3. Marks the token as used so the same link cannot be redeemed twice.
 *
 * Idempotent in the user-perception sense: a second valid call still tries to
 * update `emailVerifiedAt`, but the token guard in step 1 prevents replay
 * (the second redemption is rejected as "already used").
 */
@Injectable()
export class VerifyEmailUseCase {
  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const token = await this.tokenRepository.findByTokenHash(
      hashToken(rawToken),
    );
    if (!token || !token.isValid()) {
      throw new InvalidOrExpiredVerificationTokenError();
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user || user.status === 'INACTIVE') {
      throw new InvalidOrExpiredVerificationTokenError();
    }

    user.markEmailVerified();
    await this.userRepository.update(user);
    await this.tokenRepository.markUsed(token.id);

    this.logger.log(`[VerifyEmail] SUCCESS userId=${user.id}`);
  }
}
