import { DomainError } from 'src/shared/domain/errors/domain.error';

/** @internal Base class for `TripSchedulingConfig` validation errors. */
export abstract class TripSchedulingConfigValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when `daysAhead` is outside the supported range (1..90 inclusive)
 * or is not an integer.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class InvalidSchedulingDaysAheadError extends TripSchedulingConfigValidationError {
  code = 'INVALID_SCHEDULING_DAYS_AHEAD';

  constructor(value: number) {
    super(
      `Invalid daysAhead "${value}". Must be an integer between 1 and 90 (inclusive).`,
    );
  }
}

/**
 * Thrown when the requested organisation has no scheduling config row.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class TripSchedulingConfigNotFoundError extends DomainError {
  code = 'TRIP_SCHEDULING_CONFIG_NOT_FOUND';

  constructor(organizationId: string) {
    super(`No scheduling config found for organization "${organizationId}".`);
  }
}
