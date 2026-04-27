import { DomainError } from 'src/shared/domain/errors';

/**
 * Thrown when a plan cannot be found by the provided numeric id.
 *
 * @remarks Maps to HTTP `404 Not Found`.
 */
export class PlanNotFoundError extends DomainError {
  readonly code = 'PLAN_NOT_FOUND';

  constructor(id: number) {
    super(`Plan with id "${id}" not found`);
  }
}

/**
 * Thrown when attempting to create a plan whose name already exists.
 *
 * @remarks Maps to HTTP `409 Conflict`.
 */
export class PlanAlreadyExistsError extends DomainError {
  readonly code = 'PLAN_ALREADY_EXISTS';

  constructor(name: string) {
    super(`Plan with name "${name}" already exists`);
  }
}

/**
 * Thrown when the plan record fails to be persisted due to an unexpected repository error.
 *
 * @remarks Maps to HTTP `400 Bad Request`.
 */
export class PlanCreationFailedError extends DomainError {
  readonly code = 'PLAN_CREATION_FAILED_BAD_REQUEST';

  constructor() {
    super('Plan could not be persisted');
  }
}
