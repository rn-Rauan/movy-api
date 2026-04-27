import { DomainError } from 'src/shared/domain/errors';

/**
 * Thrown when a booking cannot be found by the provided UUID.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class BookingNotFoundError extends DomainError {
  readonly code = 'BOOKING_NOT_FOUND';

  constructor(id: string) {
    super(`Booking with id "${id}" not found`);
  }
}

/**
 * Thrown when a user without ownership or org access attempts to read or mutate a booking.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class BookingAccessForbiddenError extends DomainError {
  readonly code = 'BOOKING_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to booking "${id}" is forbidden`);
  }
}

/**
 * Thrown when a user attempts to book a trip instance they already have an active booking for.
 *
 * @remarks Maps to HTTP `409 Conflict`.
 */
export class BookingAlreadyExistsError extends DomainError {
  readonly code = 'BOOKING_ALREADY_EXISTS_CONFLICT';

  constructor(userId: string, tripInstanceId: string) {
    super(
      `User "${userId}" already has a booking for trip instance "${tripInstanceId}"`,
    );
  }
}

/**
 * Thrown when either `boardingStop` or `alightingStop` is empty, or both are equal.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidBookingStopError extends DomainError {
  readonly code = 'BOOKING_STOP_BAD_REQUEST';

  constructor(reason: string) {
    super(`Invalid booking stop: ${reason}`);
  }
}

/**
 * Thrown when the booking record fails to be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class BookingCreationFailedError extends DomainError {
  readonly code = 'BOOKING_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Booking could not be persisted');
  }
}

/**
 * Thrown when a booking is requested for a trip instance that is not in a bookable status
 * (`SCHEDULED` or `CONFIRMED`).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripInstanceNotBookableError extends DomainError {
  readonly code = 'BOOKING_TRIP_INSTANCE_NOT_BOOKABLE_BAD_REQUEST';

  constructor(tripInstanceId: string, status: string) {
    super(
      `Trip instance "${tripInstanceId}" is not open for bookings (status: ${status})`,
    );
  }
}

/**
 * Thrown when the active booking count has reached the trip instance's `totalCapacity`.
 *
 * @remarks Maps to HTTP `409 Conflict`.
 */
export class TripInstanceFullError extends DomainError {
  readonly code = 'BOOKING_TRIP_INSTANCE_FULL_CONFLICT';

  constructor(tripInstanceId: string) {
    super(`Trip instance "${tripInstanceId}" has reached its maximum capacity`);
  }
}

/**
 * Thrown when attempting to cancel a booking whose trip instance is already
 * `IN_PROGRESS` or `FINISHED`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class BookingCancellationNotAllowedError extends DomainError {
  readonly code = 'BOOKING_CANCELLATION_NOT_ALLOWED_BAD_REQUEST';

  constructor(tripInstanceId: string, status: string) {
    super(
      `Cannot cancel booking: trip instance "${tripInstanceId}" is already ${status}`,
    );
  }
}

/**
 * Thrown when the price is not configured for the given {@link EnrollmentType}
 * in the associated `TripTemplate`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripPriceNotAvailableError extends DomainError {
  readonly code = 'BOOKING_PRICE_NOT_AVAILABLE_BAD_REQUEST';

  constructor(enrollmentType: string) {
    super(
      `Price is not configured for enrollment type "${enrollmentType}" in this trip`,
    );
  }
}

/**
 * Thown when attempting to cancel a booking that is already `INACTIVE`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class BookingAlreadyInactiveError extends DomainError {
  readonly code = 'BOOKING_ALREADY_INACTIVE_BAD_REQUEST';

  constructor(id: string) {
    super(`Booking "${id}" is already inactive/canceled`);
  }
}

/**
 * Thown when attempting to cancel a booking whose departure time is within the cancellation deadline (e.g. 30 minutes).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class BookingCancellationDeadlineError extends DomainError {
  readonly code = 'BOOKING_CANCELLATION_DEADLINE_BAD_REQUEST';

  constructor(id: string) {
    super(`Cancellation deadline for booking "${id}" has already passed`);
  }
}
