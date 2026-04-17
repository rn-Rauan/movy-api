import { DomainError } from 'src/shared';

/** Base for all plate validation errors */
export abstract class PlateValidationError extends DomainError {
  abstract code: string;
}

/** Thrown when the plate string does not pass format validation */
export class InvalidPlateError extends PlateValidationError {
  code = 'INVALID_PLATE';

  constructor(plate: string, reason?: string) {
    const message = reason
      ? `Invalid plate "${plate}": ${reason}`
      : `Invalid plate "${plate}"`;
    super(message);
  }
}

/** Thrown when a vehicle with the given ID is not found */
export class VehicleNotFoundError extends DomainError {
  code = 'VEHICLE_NOT_FOUND';

  constructor(id: string) {
    super(`Vehicle with id "${id}" not found`);
  }
}

/** Thrown when the requester does not own the vehicle */
export class VehicleAccessForbiddenError extends DomainError {
  code = 'VEHICLE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to vehicle "${id}" is forbidden`);
  }
}

/** Thrown when trying to register a plate that is already in use */
export class PlateAlreadyInUseError extends DomainError {
  code = 'PLATE_ALREADY_IN_USE';

  constructor(plate: string) {
    super(`Plate "${plate}" is already registered`);
  }
}

/** Thrown when maxCapacity is not a valid positive integer */
export class InvalidMaxCapacityError extends DomainError {
  code = 'INVALID_MAX_CAPACITY';

  constructor(value: number) {
    super(`maxCapacity must be a positive integer, got "${value}"`);
  }
}

/** Thrown when persistence fails on vehicle creation */
export class VehicleCreationFailedError extends DomainError {
  code = 'VEHICLE_CREATION_FAILED';

  constructor() {
    super('Failed to create vehicle');
  }
}

/** Thrown when persistence fails on vehicle update */
export class VehicleUpdateFailedError extends DomainError {
  code = 'VEHICLE_UPDATE_FAILED';

  constructor(id: string) {
    super(`Failed to update vehicle with id "${id}"`);
  }
}

/** Thrown when trying to update a vehicle that has been soft-deleted */
export class VehicleInactiveError extends DomainError {
  code = 'VEHICLE_INACTIVE';

  constructor(id: string) {
    super(`Vehicle "${id}" is inactive and cannot be updated`);
  }
}
