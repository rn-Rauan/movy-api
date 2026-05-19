import { createHash, randomUUID } from 'crypto';

/** TTL for password reset tokens in milliseconds (1 hour). */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/**
 * @internal Internal state of a {@link PasswordResetToken}.
 *
 * `rawToken` is only populated when the entity was just created via {@link create}
 * (i.e. before persistence). It is intentionally absent after {@link restore}
 * because the raw value is never stored in the database — only its hash is.
 */
interface PasswordResetTokenState {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  usedAt: Date | null;
  readonly createdAt: Date;
  readonly rawToken?: string;
}

/**
 * Computes the SHA-256 hash of a raw token. Reused at issuance time (factory)
 * and at lookup time (caller hashes incoming token and queries `findByTokenHash`).
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Domain entity representing a one-shot password-reset token.
 *
 * Lifecycle:
 * 1. `create(userId)` → generates a UUID raw token + its SHA-256 hash + 1h TTL.
 *    The raw token is emailed to the user (read via `rawToken`); only the hash
 *    is persisted.
 * 2. On `POST /auth/reset-password`, the controller hashes the incoming token
 *    and the repository looks it up. If found and `isValid()`, the password is
 *    updated and `markUsed()` is called.
 * 3. `markUsed()` stamps `usedAt` so the same token cannot be redeemed twice.
 *
 * @see RefreshToken — the same hashed-storage pattern is used for refresh JTIs.
 */
export class PasswordResetToken {
  private readonly props: PasswordResetTokenState;

  private constructor(props: PasswordResetTokenState) {
    this.props = props;
  }

  /**
   * Issues a fresh password-reset token for the given user. Resolves the raw
   * UUID (returned via `rawToken`) and the SHA-256 hash (persisted). TTL = 1h.
   */
  static create(userId: string): PasswordResetToken {
    const rawToken = randomUUID();
    const now = new Date();
    return new PasswordResetToken({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
      usedAt: null,
      createdAt: now,
      rawToken,
    });
  }

  /**
   * Rehydrates from persistence. Never sets `rawToken` — the original is
   * unrecoverable by design.
   */
  static restore(
    props: Omit<PasswordResetTokenState, 'rawToken'>,
  ): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get usedAt(): Date | null {
    return this.props.usedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  /**
   * Raw UUID token — only populated immediately after {@link create}. Caller
   * must read it before persistence and embed it in the outgoing email.
   */
  get rawToken(): string | undefined {
    return this.props.rawToken;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  /** A token is redeemable iff it has not expired and has not been used. */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /** Marks the token as redeemed. Subsequent {@link isValid} returns false. */
  markUsed(): void {
    this.props.usedAt = new Date();
  }
}
