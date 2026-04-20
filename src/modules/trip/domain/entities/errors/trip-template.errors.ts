import { DomainError } from 'src/shared/domain/errors/domain.error';

/** Base for all TripTemplate validation errors */
export abstract class TripTemplateValidationError extends DomainError {
  abstract code: string;
}

/** Thrown when departurePoint and destination are the same or either is empty */
export class InvalidTripRoutePointsError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_ROUTE_POINTS';

  constructor() {
    super('departurePoint and destination are required and must be different');
  }
}

/** Thrown when stops array has fewer than 2 valid items */
export class InvalidTripStopsError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_STOPS';

  constructor() {
    super('Trip stops must contain at least 2 valid points');
  }
}

/** Thrown when no price is provided for any enrollment type */
export class InvalidTripPriceConfigurationError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_PRICE_CONFIGURATION';

  constructor() {
    super('At least one trip price must be provided');
  }
}

/** Thrown when a recurring trip has no frequency days defined */
export class InvalidTripFrequencyError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_FREQUENCY';

  constructor() {
    super('Recurring trips must define at least one day of week');
  }
}

/** Thrown when auto-cancel is enabled but minRevenue or autoCancelOffset are missing or invalid */
export class InvalidTripAutoCancelConfigurationError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_AUTO_CANCEL_CONFIGURATION';

  constructor(reason?: string) {
    super(
      reason
        ? `Invalid auto-cancel configuration: ${reason}`
        : 'Invalid auto-cancel configuration',
    );
  }
}

/** Thrown when a TripTemplate with the given ID is not found */
export class TripTemplateNotFoundError extends DomainError {
  code = 'TRIP_TEMPLATE_NOT_FOUND';

  constructor(id: string) {
    super(`Trip template with id "${id}" not found`);
  }
}

/** Thrown when the requester does not own the TripTemplate */
export class TripTemplateAccessForbiddenError extends DomainError {
  code = 'TRIP_TEMPLATE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to trip template "${id}" is forbidden`);
  }
}

/** Thrown when an operation requires an active TripTemplate but it is INACTIVE */
export class TripTemplateInactiveError extends DomainError {
  code = 'TRIP_TEMPLATE_INACTIVE';

  constructor(id: string) {
    super(`Trip template "${id}" is inactive`);
  }
}

/** Thrown when persistence fails on TripTemplate creation */
export class TripTemplateCreationFailedError extends DomainError {
  code = 'TRIP_TEMPLATE_CREATION_FAILED';

  constructor() {
    super('Failed to create trip template');
  }
}
