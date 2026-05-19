import { EmailVerificationToken } from '../entities/email-verification-token.entity';

/**
 * Repository contract for {@link EmailVerificationToken}. Same access pattern
 * as {@link PasswordResetTokenRepository}: lookup by SHA-256 hash; raw token
 * never leaves the requester's hand.
 */
export abstract class EmailVerificationTokenRepository {
  abstract save(token: EmailVerificationToken): Promise<void>;

  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;

  abstract markUsed(id: string): Promise<void>;
}
