import { DomainError } from 'src/shared/domain/errors';

export class SubscriptionNotFoundError extends DomainError {
  readonly code = 'SUBSCRIPTION_NOT_FOUND';

  constructor(id: string) {
    super(`Subscription with id "${id}" not found`);
  }
}

export class SubscriptionAlreadyActiveError extends DomainError {
  readonly code = 'SUBSCRIPTION_ALREADY_EXISTS';

  constructor(organizationId: string) {
    super(
      `Organization "${organizationId}" already has an active subscription`,
    );
  }
}

export class SubscriptionCreationFailedError extends DomainError {
  readonly code = 'SUBSCRIPTION_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Subscription could not be persisted');
  }
}

export class SubscriptionForbiddenError extends DomainError {
  readonly code = 'SUBSCRIPTION_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`You do not have access to subscription "${id}"`);
  }
}
