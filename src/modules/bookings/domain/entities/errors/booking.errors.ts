import { DomainError } from 'src/shared/domain/errors';

export class BookingNotFoundError extends DomainError {
  readonly code = 'BOOKING_NOT_FOUND';

  constructor(id: string) {
    super(`Booking with id "${id}" not found`);
  }
}

export class BookingAccessForbiddenError extends DomainError {
  readonly code = 'BOOKING_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to booking "${id}" is forbidden`);
  }
}

export class BookingAlreadyExistsError extends DomainError {
  readonly code = 'BOOKING_ALREADY_EXISTS_CONFLICT';

  constructor(userId: string, tripInstanceId: string) {
    super(
      `User "${userId}" already has a booking for trip instance "${tripInstanceId}"`,
    );
  }
}

export class InvalidBookingStopError extends DomainError {
  readonly code = 'BOOKING_STOP_BAD_REQUEST';

  constructor(reason: string) {
    super(`Invalid booking stop: ${reason}`);
  }
}

export class BookingCreationFailedError extends DomainError {
  readonly code = 'BOOKING_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Booking could not be persisted');
  }
}

export class TripInstanceNotBookableError extends DomainError {
  readonly code = 'BOOKING_TRIP_INSTANCE_NOT_BOOKABLE_BAD_REQUEST';

  constructor(tripInstanceId: string, status: string) {
    super(
      `Trip instance "${tripInstanceId}" is not open for bookings (status: ${status})`,
    );
  }
}

export class TripInstanceFullError extends DomainError {
  readonly code = 'BOOKING_TRIP_INSTANCE_FULL_CONFLICT';

  constructor(tripInstanceId: string) {
    super(`Trip instance "${tripInstanceId}" has reached its maximum capacity`);
  }
}

export class BookingCancellationNotAllowedError extends DomainError {
  readonly code = 'BOOKING_CANCELLATION_NOT_ALLOWED_BAD_REQUEST';

  constructor(tripInstanceId: string, status: string) {
    super(
      `Cannot cancel booking: trip instance "${tripInstanceId}" is already ${status}`,
    );
  }
}

export class TripPriceNotAvailableError extends DomainError {
  readonly code = 'BOOKING_PRICE_NOT_AVAILABLE_BAD_REQUEST';

  constructor(enrollmentType: string) {
    super(
      `Price is not configured for enrollment type "${enrollmentType}" in this trip`,
    );
  }
}

export class BookingAlreadyInactiveError extends DomainError {
  readonly code = 'BOOKING_ALREADY_INACTIVE_BAD_REQUEST';

  constructor(id: string) {
    super(`Booking "${id}" is already inactive/canceled`);
  }
}

export class BookingCancellationDeadlineError extends DomainError {
  readonly code = 'BOOKING_CANCELLATION_DEADLINE_BAD_REQUEST';

  constructor(id: string) {
    super(`Cancellation deadline for booking "${id}" has already passed`);
  }
}
