import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Base class for all Driver domain validation errors.
 * Maps to HTTP 400 Bad Request unless a subclass specifies otherwise.
 */
export abstract class DriverValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when a CNH string does not match the expected format (9–12 alphanumeric chars).
 * HTTP 400 — code: `INVALID_CNH`
 */
export class InvalidCnhError extends DriverValidationError {
  code = 'INVALID_CNH';

  constructor(cnh: string, reason?: string) {
    const message = reason
      ? `Invalid CNH "${cnh}": ${reason}`
      : `Invalid CNH "${cnh}". Expected format: 9-12 alphanumeric characters`;
    super(message);
  }
}

/**
 * Thrown when a CNH category is not one of the allowed values (A, B, C, D, E).
 * HTTP 400 — code: `INVALID_CNH_CATEGORY`
 */
export class InvalidCnhCategoryError extends DriverValidationError {
  code = 'INVALID_CNH_CATEGORY';

  constructor(category: string) {
    super(
      `Invalid CNH category "${category}". Valid categories are: A, B, C, D, E`,
    );
  }
}

/**
 * Thrown when the CNH expiration date is in the past.
 * HTTP 400 — code: `INVALID_CNH_EXPIRATION`
 */
export class InvalidCnhExpirationError extends DriverValidationError {
  code = 'INVALID_CNH_EXPIRATION';

  constructor(expirationDate: Date) {
    super(
      `Invalid CNH expiration date: ${expirationDate.toISOString()}. Date must be in the future`,
    );
  }
}

/**
 * Thrown when a driver attempts an operation with an already-expired CNH.
 * HTTP 400 — code: `EXPIRED_CNH`
 */
export class ExpiredCnhError extends DriverValidationError {
  code = 'EXPIRED_CNH';

  constructor(expirationDate: Date) {
    super(
      `Driver license (CNH) has expired on ${expirationDate.toISOString()}`,
    );
  }
}

/**
 * Thrown when an unrecognised driver status string is provided.
 * HTTP 400 — code: `INVALID_DRIVER_STATUS`
 */
export class InvalidDriverStatusError extends DriverValidationError {
  code = 'INVALID_DRIVER_STATUS';

  constructor(status: string) {
    super(
      `Invalid driver status "${status}". Valid statuses are: ACTIVE, INACTIVE, SUSPENDED`,
    );
  }
}

/**
 * Thrown when no driver matches the provided identifier (id, userId, or CNH).
 * HTTP 404 — code: `DRIVER_NOT_FOUND_BAD_REQUEST`
 */
export class DriverNotFoundError extends DriverValidationError {
  code = 'DRIVER_NOT_FOUND_BAD_REQUEST';

  constructor(driverId?: string, userId?: string, cnh?: string) {
    const identifier = driverId ?? userId ?? (cnh ? `CNH ${cnh}` : undefined);
    super(
      `Driver${identifier ? ` with identifier "${identifier}"` : ''} not found`,
    );
  }
}

/**
 * Thrown during driver lookup when no user exists with the provided email.
 * HTTP 404 — code: `DRIVER_PROFILE_NOT_FOUND_BAD_REQUEST`
 */
export class DriverProfileNotFoundByEmailError extends DriverValidationError {
  code = 'DRIVER_PROFILE_NOT_FOUND_BAD_REQUEST';

  constructor(email: string) {
    super(`No user found with email "${email}". Cannot perform driver lookup.`);
  }
}

/**
 * Thrown when the persistence layer fails to save a new driver.
 * HTTP 500 — code: `DRIVER_CREATION_FAILED`
 */
export class DriverCreationFailedError extends DomainError {
  code = 'DRIVER_CREATION_FAILED';

  constructor(message: string = 'Failed to create driver') {
    super(message);
  }
}

/**
 * Thrown when the persistence layer fails to update an existing driver.
 * HTTP 500 — code: `DRIVER_UPDATE_FAILED`
 */
export class DriverUpdateFailedError extends DomainError {
  code = 'DRIVER_UPDATE_FAILED';

  constructor(message: string = 'Failed to update driver') {
    super(message);
  }
}

/**
 * Thrown when attempting to create a driver profile for a user who already has one.
 * HTTP 409 — code: `DRIVER_ALREADY_EXISTS_CONFLICT`
 */
export class DriverAlreadyExistsError extends DriverValidationError {
  code = 'DRIVER_ALREADY_EXISTS_CONFLICT';

  constructor(userId: string) {
    super(`User "${userId}" already has a driver profile`);
  }
}

/**
 * Thrown when only some CNH-related fields are provided on update (all-or-nothing rule).
 * HTTP 400 — code: `INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST`
 */
export class PartialCnhUpdateError extends DriverValidationError {
  code = 'INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST';

  constructor() {
    super(
      'To update CNH, all fields must be provided: cnh, cnhCategory, cnhExpiresAt',
    );
  }
}

/**
 * Thrown when the requesting organization does not own the target driver profile.
 * HTTP 403 — code: `DRIVER_ACCESS_FORBIDDEN`
 */
export class DriverAccessForbiddenError extends DomainError {
  code = 'DRIVER_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to driver "${id}" is forbidden`);
  }
}
