import { DomainError } from 'src/shared/domain/errors/domain.error';
import { TripStatus } from '../../interfaces';

/**
 * Thrown when a `TripInstance` is created with `totalCapacity <= 0`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripInstanceCapacityError extends DomainError {
  readonly code = 'TRIP_INSTANCE_CAPACITY_BAD_REQUEST';
  constructor(capacity: number) {
    super(
      `Trip instance total capacity must be non-negative, received: ${capacity}`,
    );
  }
}

/**
 * Thrown when `arrivalEstimate` is not strictly after `departureTime`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripInstanceTimesError extends DomainError {
  readonly code = 'TRIP_INSTANCE_TIMES_BAD_REQUEST';
  constructor() {
    super('Trip instance arrival estimate must be after departure time');
  }
}

/**
 * Thrown when `autoCancelAt` is not strictly before `departureTime`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripInstanceAutoCancelTimeError extends DomainError {
  readonly code = 'TRIP_INSTANCE_AUTO_CANCEL_BAD_REQUEST';
  constructor() {
    super('Trip instance auto-cancel time must be before departure time');
  }
}

/**
 * Thrown when the requested status transition is not allowed by the state machine.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 * @see TripStatus
 */
export class InvalidTripStatusTransitionError extends DomainError {
  readonly code = 'TRIP_INSTANCE_STATUS_TRANSITION_BAD_REQUEST';
  constructor(from: TripStatus, to: TripStatus) {
    super(`Cannot transition trip instance status from ${from} to ${to}`);
  }
}

/**
 * Thrown when a field required for a specific status (e.g. `driverId` for `SCHEDULED`)
 * is `null` at the time of transition.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripInstanceRequiredFieldError extends DomainError {
  readonly code = 'TRIP_INSTANCE_REQUIRED_FIELD_BAD_REQUEST';
  constructor(field: string, status: TripStatus) {
    super(
      `Field "${field}" is required when trip instance is in status: ${status}`,
    );
  }
}

/**
 * Thrown when a `TripInstance` cannot be found by the provided UUID.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class TripInstanceNotFoundError extends DomainError {
  code = 'TRIP_INSTANCE_NOT_FOUND';

  constructor(id: string) {
    super(`Trip instance with id "${id}" not found`);
  }
}

/**
 * Thrown when the calling organisation does not own the requested `TripInstance`.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class TripInstanceAccessForbiddenError extends DomainError {
  code = 'TRIP_INSTANCE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to trip instance "${id}" is forbidden`);
  }
}

/**
 * Thrown when the `TripInstance` row cannot be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripInstanceCreationFailedError extends DomainError {
  code = 'TRIP_INSTANCE_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Trip instance could not be persisted');
  }
}

/**
 * Thrown when a driver attempts to act on a `TripInstance` they are not assigned to,
 * or have no active driver profile in the requesting organisation.
 *
 * @remarks Maps to HTTP `403 Forbidden`. Same message regardless of which sub-case
 * triggered it (missing profile / inactive / not the assigned driver) to avoid
 * leaking driver state to the caller.
 */
export class TripNotAssignedToDriverError extends DomainError {
  code = 'TRIP_NOT_ASSIGNED_TO_DRIVER_FORBIDDEN';

  constructor(id: string) {
    super(`Trip instance "${id}" is not assigned to the requesting driver`);
  }
}

/**
 * Thrown when a driver attempts to transition a trip to a status they are not
 * allowed to set. Drivers may only transition to `IN_PROGRESS` (boarding) or
 * `FINISHED` (arrival); all other transitions remain admin-only.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class DriverTripStatusTransitionForbiddenError extends DomainError {
  code = 'DRIVER_TRIP_STATUS_TRANSITION_FORBIDDEN';

  constructor(target: TripStatus) {
    super(
      `Drivers may only transition trips to IN_PROGRESS or FINISHED; "${target}" is not allowed`,
    );
  }
}
