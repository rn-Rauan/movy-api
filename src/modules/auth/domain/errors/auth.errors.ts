import { DomainError } from 'src/shared/domain/errors';

/**
 * Thrown when a password-reset token is missing, expired, or already redeemed.
 *
 * The three failure modes are deliberately conflated into a single error to
 * avoid leaking information (an attacker could otherwise distinguish "valid
 * but used" from "never existed" via response inspection).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidOrExpiredResetTokenError extends DomainError {
  readonly code = 'INVALID_OR_EXPIRED_RESET_TOKEN_BAD_REQUEST';

  constructor() {
    super('Password reset token is invalid, expired, or already used');
  }
}

/**
 * Thrown when an email-verification token is missing, expired, or already redeemed.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidOrExpiredVerificationTokenError extends DomainError {
  readonly code = 'INVALID_OR_EXPIRED_VERIFICATION_TOKEN_BAD_REQUEST';

  constructor() {
    super('Email verification token is invalid, expired, or already used');
  }
}
