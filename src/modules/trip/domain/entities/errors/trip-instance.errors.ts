import { DomainError } from 'src/shared/domain/errors/domain.error';
import { TripStatus } from '../../interfaces';

/**
 * Error thrown when a TripInstance's capacity is invalid (must be >= 0).
 */
export class InvalidTripInstanceCapacityError extends DomainError {
  readonly code = 'TRIP_INSTANCE_CAPACITY_BAD_REQUEST';
  constructor(capacity: number) {
    super(`Trip instance total capacity must be non-negative, received: ${capacity}`);
  }
}

/**
 * Error thrown when arrival time is not after departure time.
 */
export class InvalidTripInstanceTimesError extends DomainError {
  readonly code = 'TRIP_INSTANCE_TIMES_BAD_REQUEST';
  constructor() {
    super('Trip instance arrival estimate must be after departure time');
  }
}

/**
 * Error thrown when auto-cancel time is not before departure time.
 */
export class InvalidTripInstanceAutoCancelTimeError extends DomainError {
  readonly code = 'TRIP_INSTANCE_AUTO_CANCEL_BAD_REQUEST';
  constructor() {
    super('Trip instance auto-cancel time must be before departure time');
  }
}

/**
 * Error thrown when trying to perform an invalid state transition.
 */
export class InvalidTripStatusTransitionError extends DomainError {
  readonly code = 'TRIP_INSTANCE_STATUS_TRANSITION_BAD_REQUEST';
  constructor(from: TripStatus, to: TripStatus) {
    super(`Cannot transition trip instance status from ${from} to ${to}`);
  }
}

/**
 * Error thrown when a required field is missing for a specific status.
 */
export class TripInstanceRequiredFieldError extends DomainError {
  readonly code = 'TRIP_INSTANCE_REQUIRED_FIELD_BAD_REQUEST';
  constructor(field: string, status: TripStatus) {
    super(`Field "${field}" is required when trip instance is in status: ${status}`);
  }
}

/** Thrown when a TripInstance with the given ID is not found */
export class TripInstanceNotFoundError extends DomainError {
  code = 'TRIP_INSTANCE_NOT_FOUND';

  constructor(id: string) {
    super(`Trip instance with id "${id}" not found`);
  }
}

/** Thrown when the requester does not own the TripInstance */
export class TripInstanceAccessForbiddenError extends DomainError {
  code = 'TRIP_INSTANCE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to trip instance "${id}" is forbidden`);
  }
}

/** Thrown when persistence fails during trip instance creation */
export class TripInstanceCreationFailedError extends DomainError {
  code = 'TRIP_INSTANCE_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Trip instance could not be persisted');
  }
}
