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
  readonly code = 'BOOKING_ALREADY_EXISTS';

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
