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

/**
 * Thrown during login when the supplied password does not match the stored hash.
 *
 * @remarks
 * Maps to HTTP `401 Unauthorized`. The code deliberately avoids the `INVALID_`
 * prefix because {@link AllExceptionsFilter} tests `startsWith('INVALID_')`
 * before the `_UNAUTHORIZED` suffix — an `INVALID_*` code would resolve to 400.
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'CREDENTIALS_UNAUTHORIZED';

  constructor() {
    super('Invalid credentials');
  }
}

/**
 * Thrown during login when the user account exists but is `INACTIVE`.
 *
 * @remarks Maps to HTTP `401 Unauthorized`.
 */
export class InactiveAccountError extends DomainError {
  readonly code = 'ACCOUNT_INACTIVE_UNAUTHORIZED';

  constructor() {
    super('User account is inactive');
  }
}

/**
 * Thrown when a refresh token fails signature verification, is expired, was
 * revoked (JTI absent from the store), or belongs to a missing/inactive user.
 *
 * The failure modes are deliberately conflated into a single error to avoid
 * leaking which condition failed.
 *
 * @remarks Maps to HTTP `401 Unauthorized` (code ends in `_UNAUTHORIZED` and
 * does not start with `INVALID_` — see {@link InvalidCredentialsError}).
 */
export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'REFRESH_TOKEN_UNAUTHORIZED';

  constructor() {
    super('Invalid refresh token');
  }
}
