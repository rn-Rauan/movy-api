import { RoleName } from '../types';
import { DomainError } from './domain.error';

/**
 * Error for when a user does not have the required role to perform an action.
 */
export class InsufficientPermissionError extends DomainError {
  code = 'INSUFFICIENT_PERMISSION';

  constructor(requiredRoles: RoleName[]) {
    const message = `User does not have the required permission. Required: ${requiredRoles.join(
      ' or ',
    )}`;
    super(message);
  }
}

/**
 * Error for when a role is not found.
 */
export class RoleNotFoundError extends DomainError {
  code = 'ROLE_NOT_FOUND';

  constructor(identifier: string | number) {
    super(`Role with identifier "${identifier}" not found`);
  }
}
