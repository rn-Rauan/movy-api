import { randomUUID } from 'crypto';
import { hashToken } from './password-reset-token.entity';

/** TTL for email-verification tokens in milliseconds (24 hours). */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @internal Internal state of an {@link EmailVerificationToken}.
 * See {@link PasswordResetToken} for the dual raw/hash representation rationale.
 */
interface EmailVerificationTokenState {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  usedAt: Date | null;
  readonly createdAt: Date;
  readonly rawToken?: string;
}

/**
 * Domain entity representing a one-shot email-verification token.
 *
 * Same lifecycle and security model as {@link PasswordResetToken}, with a 24-hour
 * TTL. Successful verification marks `usedAt` and flips
 * {@link User.emailVerifiedAt} to the current instant.
 */
export class EmailVerificationToken {
  private readonly props: EmailVerificationTokenState;

  private constructor(props: EmailVerificationTokenState) {
    this.props = props;
  }

  /** Issues a fresh email-verification token. TTL = 24h. */
  static create(userId: string): EmailVerificationToken {
    const rawToken = randomUUID();
    const now = new Date();
    return new EmailVerificationToken({
      id: randomUUID(),
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
      usedAt: null,
      createdAt: now,
      rawToken,
    });
  }

  static restore(
    props: Omit<EmailVerificationTokenState, 'rawToken'>,
  ): EmailVerificationToken {
    return new EmailVerificationToken(props);
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
  get rawToken(): string | undefined {
    return this.props.rawToken;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  markUsed(): void {
    this.props.usedAt = new Date();
  }
}
