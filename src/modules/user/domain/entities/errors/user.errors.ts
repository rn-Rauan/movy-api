import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Abstract base for all user field validation errors.
 *
 * @remarks Maps to HTTP 400 Bad Request.
 */
export abstract class UserValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when the user name is empty or outside the allowed length range (3–255 chars).
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INVALID_USER_NAME`.
 * @see {@link UserName}
 */
export class InvalidUserNameError extends UserValidationError {
  code = 'INVALID_USER_NAME';

  constructor(name: string, reason?: string) {
    const message = reason
      ? `Invalid user name "${name}": ${reason}`
      : `Invalid user name "${name}"`;
    super(message);
  }
}

/**
 * Thrown when the telephone string does not match the expected Brazilian mobile format.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INVALID_USER_TELEPHONE`.
 */
export class InvalidUserTelephoneError extends UserValidationError {
  code = 'INVALID_USER_TELEPHONE';

  constructor(telephone: string) {
    super(
      `Invalid telephone format "${telephone}". Expected format: (XX) 9XXXX-XXXX`,
    );
  }
}

/**
 * Thrown when the raw password or password hash fails validation.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INVALID_PASSWORD`.
 */
export class InvalidPasswordError extends UserValidationError {
  code = 'INVALID_PASSWORD';

  constructor(reason?: string) {
    const message = reason
      ? `Invalid password: ${reason}`
      : 'Invalid password format';
    super(message);
  }
}

/**
 * Thrown when no user record matches the requested ID.
 *
 * @remarks
 * Maps to HTTP 404 Not Found. Code: `USER_NOT_FOUND`.
 * Also thrown by {@link FindUserByIdUseCase} when the user exists but is `INACTIVE`.
 */
export class UserNotFoundError extends DomainError {
  code = 'USER_NOT_FOUND';

  constructor(id?: string) {
    const message = id ? `User with id "${id}" not found` : 'User not found';
    super(message);
  }
}

/**
 * Thrown when attempting to register or update to an email already in use by another account.
 *
 * @remarks Maps to HTTP 409 Conflict. Code: `USER_EMAIL_ALREADY_EXISTS`.
 */
export class UserEmailAlreadyExistsError extends DomainError {
  code = 'USER_EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}

/**
 * Thrown when attempting to update or disable a user whose status is already `INACTIVE`.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INACTIVE_USER`.
 */
export class InactiveUserError extends DomainError {
  code = 'INACTIVE_USER';
  constructor(id?: string) {
    super(id ? `User with id "${id}" is inactive` : 'User is inactive');
  }
}
