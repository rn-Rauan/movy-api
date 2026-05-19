import { PasswordResetToken } from '../entities/password-reset-token.entity';

/**
 * Repository contract for {@link PasswordResetToken}. The token's raw value
 * never crosses this boundary — callers always lookup by SHA-256 hash.
 *
 * Bound to {@link PrismaPasswordResetTokenRepository} inside {@link AuthModule}.
 */
export abstract class PasswordResetTokenRepository {
  /** Persists a newly created token. The raw value is discarded by the repo. */
  abstract save(token: PasswordResetToken): Promise<void>;

  /**
   * Finds a token by its stored SHA-256 hash.
   *
   * @param tokenHash - SHA-256 hex digest of the raw token submitted by the user
   * @returns The matching token, or `null` if no row matches
   */
  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetToken | null>;

  /** Marks a token as redeemed by stamping its `usedAt` column. */
  abstract markUsed(id: string): Promise<void>;
}
