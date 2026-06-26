/**
 * Abstract base class for all domain errors.
 *
 * @remarks
 * Every domain-specific error must extend this class.
 * The `code` string suffix drives HTTP status mapping in `AllExceptionsFilter`:
 * - `_NOT_FOUND` → 404
 * - `_ALREADY_EXISTS` / `_CONFLICT` / `_IN_USE` → 409
 * - `INVALID_` / `_BAD_REQUEST` / `INACTIVE_` / `_INACTIVE` / `EXPIRED_` → 400
 * - `_FORBIDDEN` → 403
 * - `_UNAUTHORIZED` → 401
 * - (otherwise, e.g. `_CREATION_FAILED`) → 500
 */
export abstract class DomainError extends Error {
  abstract code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}
