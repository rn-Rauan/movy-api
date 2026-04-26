import { DomainError } from 'src/shared/domain/errors';

export class PlanNotFoundError extends DomainError {
  readonly code = 'PLAN_NOT_FOUND';

  constructor(id: number) {
    super(`Plan with id "${id}" not found`);
  }
}

export class PlanAlreadyExistsError extends DomainError {
  readonly code = 'PLAN_ALREADY_EXISTS';

  constructor(name: string) {
    super(`Plan with name "${name}" already exists`);
  }
}

export class PlanCreationFailedError extends DomainError {
  readonly code = 'PLAN_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Plan could not be persisted');
  }
}
