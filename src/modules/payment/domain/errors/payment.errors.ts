import { DomainError } from 'src/shared/domain/errors';

/**
 * Thrown when a payment cannot be found by the provided UUID or numeric id.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class PaymentNotFoundError extends DomainError {
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Payment with id "${id}" not found`);
  }
}

/**
 * Thrown when the payment record fails to be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class PaymentCreationFailedError extends DomainError {
  readonly code = 'PAYMENT_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Payment could not be persisted');
  }
}

/**
 * Thrown when attempting to confirm or fail a payment that is no longer PENDING.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class PaymentAlreadyProcessedError extends DomainError {
  readonly code = 'PAYMENT_ALREADY_PROCESSED_BAD_REQUEST';

  constructor(id: string) {
    super(`Payment "${id}" has already been processed and cannot be modified`);
  }
}
