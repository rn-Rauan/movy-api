import { DomainError } from 'src/shared/domain/errors/domain.error';

/** @internal Base class for all {@link TripTemplate} domain validation errors. */
export abstract class TripTemplateValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when `departurePoint` and `destination` are the same, or either is empty.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripRoutePointsError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_ROUTE_POINTS';

  constructor() {
    super('departurePoint and destination are required and must be different');
  }
}

/**
 * Thrown when the `stops` array has fewer than 2 valid (non-empty) items.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripStopsError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_STOPS';

  constructor() {
    super('Trip stops must contain at least 2 valid points');
  }
}

/**
 * Thrown when no price tier (`priceOneWay`, `priceReturn`, `priceRoundTrip`) is provided.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripPriceConfigurationError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_PRICE_CONFIGURATION';

  constructor() {
    super('At least one trip price must be provided');
  }
}

/**
 * Thrown when a recurring template has no days defined in `frequency`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripFrequencyError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_FREQUENCY';

  constructor() {
    super('Recurring trips must define at least one day of week');
  }
}

/**
 * Thrown when auto-cancel is enabled but `minRevenue` or `autoCancelOffset` are missing or invalid.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
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

/**
 * Thrown when `departureTimeOfDay` or `arrivalTimeOfDay` does not match the `HH:mm` format.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripTimeOfDayFormatError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_TIME_OF_DAY_FORMAT';

  constructor(field: string, value: string) {
    super(
      `Invalid time-of-day format for "${field}": "${value}". Expected HH:mm.`,
    );
  }
}

/**
 * Thrown when `departureTimeOfDay` equals `arrivalTimeOfDay` (zero-duration trip).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripTimeOfDayOrderError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_TIME_OF_DAY_ORDER';

  constructor() {
    super('arrivalTimeOfDay must be different from departureTimeOfDay.');
  }
}

/**
 * Thrown when generating a `TripInstance` from a template that lacks
 * `departureTimeOfDay` / `arrivalTimeOfDay` (legacy rows pre-migration).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripTemplateMissingScheduleError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_TEMPLATE_MISSING_SCHEDULE';

  constructor(templateId: string) {
    super(
      `Trip template ${templateId} is missing departureTimeOfDay/arrivalTimeOfDay.`,
    );
  }
}

/**
 * Thrown when `defaultCapacity` is missing or not a positive integer.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripTemplateDefaultCapacityError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_TEMPLATE_DEFAULT_CAPACITY';

  constructor(value: number | null | undefined) {
    super(
      `defaultCapacity must be a positive integer (received: ${value ?? 'null'}).`,
    );
  }
}

/**
 * Thrown when the recurring-generation cron encounters a template with no
 * `defaultCapacity` set (legacy rows created before the field was introduced).
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidTripTemplateMissingCapacityError extends TripTemplateValidationError {
  code = 'INVALID_TRIP_TEMPLATE_MISSING_CAPACITY';

  constructor(templateId: string) {
    super(`Trip template ${templateId} is missing defaultCapacity.`);
  }
}

/**
 * Thrown when a `TripTemplate` cannot be found by the provided UUID.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class TripTemplateNotFoundError extends DomainError {
  code = 'TRIP_TEMPLATE_NOT_FOUND';

  constructor(id: string) {
    super(`Trip template with id "${id}" not found`);
  }
}

/**
 * Thrown when the calling organisation does not own the requested `TripTemplate`.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class TripTemplateAccessForbiddenError extends DomainError {
  code = 'TRIP_TEMPLATE_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to trip template "${id}" is forbidden`);
  }
}

/**
 * Thrown when an operation requires an active template but it has `status = INACTIVE`.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripTemplateInactiveError extends DomainError {
  code = 'TRIP_TEMPLATE_INACTIVE';

  constructor(id: string) {
    super(`Trip template "${id}" is inactive`);
  }
}

/**
 * Thrown when the `TripTemplate` row cannot be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class TripTemplateCreationFailedError extends DomainError {
  code = 'TRIP_TEMPLATE_CREATION_FAILED';

  constructor() {
    super('Failed to create trip template');
  }
}
