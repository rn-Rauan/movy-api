import { DomainError } from 'src/shared/domain/errors';

/**
 * Thrown when a subscription cannot be found by the provided UUID.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class SubscriptionNotFoundError extends DomainError {
  readonly code = 'SUBSCRIPTION_NOT_FOUND';

  constructor(id: string) {
    super(`Subscription with id "${id}" not found`);
  }
}

/**
 * Thrown when attempting to subscribe an organisation that already has an ACTIVE subscription.
 *
 * @remarks Maps to HTTP `409 Conflict`.
 */
export class SubscriptionAlreadyActiveError extends DomainError {
  readonly code = 'SUBSCRIPTION_ALREADY_EXISTS';

  constructor(organizationId: string) {
    super(
      `Organization "${organizationId}" already has an active subscription`,
    );
  }
}

/**
 * Thrown when the subscription record fails to be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class SubscriptionCreationFailedError extends DomainError {
  readonly code = 'SUBSCRIPTION_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Subscription could not be persisted');
  }
}

/**
 * Thrown when an organisation admin attempts to cancel a subscription that belongs
 * to a different organisation.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class SubscriptionForbiddenError extends DomainError {
  readonly code = 'SUBSCRIPTION_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`You do not have access to subscription "${id}"`);
  }
}

/**
 * Thrown when an operation requires an active subscription but none exists.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class NoActiveSubscriptionError extends DomainError {
  readonly code = 'NO_ACTIVE_SUBSCRIPTION_FORBIDDEN';

  constructor(organizationId: string) {
    super(
      `Organization "${organizationId}" has no active subscription. Subscribe to a plan to continue.`,
    );
  }
}

/**
 * Thrown when creating a vehicle would exceed the plan's `maxVehicles` limit.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class VehicleLimitExceededError extends DomainError {
  readonly code = 'VEHICLE_PLAN_LIMIT_FORBIDDEN';

  constructor(limit: number) {
    super(
      `Your plan allows a maximum of ${limit} active vehicle(s). Upgrade your plan to add more.`,
    );
  }
}

/**
 * Thrown when creating a driver would exceed the plan's `maxDrivers` limit.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class DriverLimitExceededError extends DomainError {
  readonly code = 'DRIVER_PLAN_LIMIT_FORBIDDEN';

  constructor(limit: number) {
    super(
      `Your plan allows a maximum of ${limit} active driver(s). Upgrade your plan to add more.`,
    );
  }
}

/**
 * Thrown when scheduling a trip instance would exceed the plan's `maxMonthlyTrips` limit.
 *
 * @remarks Maps to HTTP `403 Forbidden`.
 */
export class MonthlyTripLimitExceededError extends DomainError {
  readonly code = 'MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN';

  constructor(limit: number) {
    super(
      `Your plan allows a maximum of ${limit} trip(s) per month. Upgrade your plan to schedule more.`,
    );
  }
}
