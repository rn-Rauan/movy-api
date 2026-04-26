import { DomainError } from 'src/shared/domain/errors';

export class PaymentNotFoundError extends DomainError {
  readonly code = 'PAYMENT_NOT_FOUND';

  constructor(id: string) {
    super(`Payment with id "${id}" not found`);
  }
}

export class PaymentCreationFailedError extends DomainError {
  readonly code = 'PAYMENT_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Payment could not be persisted');
  }
}
