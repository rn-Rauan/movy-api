import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Abstract base for all plate format validation errors.
 *
 * @remarks Maps to HTTP 400 Bad Request.
 */
export abstract class PlateValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when a plate string does not match any valid Brazilian plate format.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INVALID_PLATE`.
 * @see {@link Plate}
 */
export class InvalidPlateError extends PlateValidationError {
  code = 'INVALID_PLATE';

  constructor(plate: string, reason?: string) {
    const message = reason
      ? `Invalid plate "${plate}": ${reason}`
      : `Invalid plate "${plate}"`;
    super(message);
  }
}

/**
 * Thrown when no vehicle record matches the requested ID.
 *
 * @remarks Maps to HTTP 404 Not Found. Code: `VEHICLE_NOT_FOUND`.
 */
export class VehicleNotFoundError extends DomainError {
  code = 'VEHICLE_NOT_FOUND';

  constructor(id: string) {
    super(`Vehicle with id "${id}" not found`);
  }
}

/**
 * Thrown when the requesting organisation does not own the vehicle.
 *
 * @remarks Maps to HTTP 403 Forbidden. Code: `VEHICLE_ACCESS_FORBIDDEN`.
 */
export class VehicleAccessForbiddenError extends DomainError {
  code = 'VEHICLE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to vehicle "${id}" is forbidden`);
  }
}

/**
 * Thrown when attempting to register or update to a plate that is already in use.
 *
 * @remarks Maps to HTTP 409 Conflict. Code: `PLATE_ALREADY_IN_USE`.
 */
export class PlateAlreadyInUseError extends DomainError {
  code = 'PLATE_ALREADY_IN_USE';

  constructor(plate: string) {
    super(`Plate "${plate}" is already registered`);
  }
}

/**
 * Thrown when `maxCapacity` is not a valid positive integer.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `INVALID_MAX_CAPACITY`.
 */
export class InvalidMaxCapacityError extends DomainError {
  code = 'INVALID_MAX_CAPACITY';

  constructor(value: number) {
    super(`maxCapacity must be a positive integer, got "${value}"`);
  }
}

/**
 * Thrown when the persistence layer fails to create a vehicle record.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `VEHICLE_CREATION_FAILED`.
 */
export class VehicleCreationFailedError extends DomainError {
  code = 'VEHICLE_CREATION_FAILED';

  constructor() {
    super('Failed to create vehicle');
  }
}

/**
 * Thrown when the persistence layer fails to update a vehicle record.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `VEHICLE_UPDATE_FAILED`.
 */
export class VehicleUpdateFailedError extends DomainError {
  code = 'VEHICLE_UPDATE_FAILED';

  constructor(id: string) {
    super(`Failed to update vehicle with id "${id}"`);
  }
}

/**
 * Thrown when attempting to update a vehicle whose status is `INACTIVE`.
 *
 * @remarks Maps to HTTP 400 Bad Request. Code: `VEHICLE_INACTIVE`.
 * Re-activate the vehicle before applying updates.
 */
export class VehicleInactiveError extends DomainError {
  code = 'VEHICLE_INACTIVE';

  constructor(id: string) {
    super(`Vehicle "${id}" is inactive and cannot be updated`);
  }
}
