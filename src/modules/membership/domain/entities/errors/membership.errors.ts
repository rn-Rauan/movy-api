import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Thrown when no membership is found for the given composite key.
 * HTTP 404 — code: `MEMBERSHIP_NOT_FOUND`
 */
export class MembershipNotFoundError extends DomainError {
  code = 'MEMBERSHIP_NOT_FOUND';

  constructor(userId?: string, roleId?: number, organizationId?: string) {
    const message =
      userId && roleId && organizationId
        ? `Membership for user "${userId}", role "${roleId}" and organization "${organizationId}" not found`
        : 'Membership not found';
    super(message);
  }
}

/**
 * Thrown when a membership with the same `(userId, roleId, organizationId)` composite key already exists and is active.
 * HTTP 409 — code: `MEMBERSHIP_ALREADY_EXISTS`
 */
export class MembershipAlreadyExistsError extends DomainError {
  code = 'MEMBERSHIP_ALREADY_EXISTS';

  constructor(userId: string, roleId: number, organizationId: string) {
    super(
      `Membership for user "${userId}", role "${roleId}" and organization "${organizationId}" already exists.`,
    );
  }
}

/**
 * Thrown when no user is found for the provided email during membership creation.
 * HTTP 404 — code: `USER_FOR_MEMBERSHIP_NOT_FOUND`
 */
export class UserNotFoundForMembershipError extends DomainError {
  code = 'USER_FOR_MEMBERSHIP_NOT_FOUND';

  constructor(email: string) {
    super(`User with email "${email}" not found`);
  }
}

/**
 * Thrown when neither `userId` nor `userEmail` is supplied in a membership request.
 * HTTP 400 — code: `MEMBERSHIP_MISSING_IDENTIFIER_BAD_REQUEST`
 */
export class MembershipMissingIdentifierError extends DomainError {
  code = 'MEMBERSHIP_MISSING_IDENTIFIER_BAD_REQUEST';

  constructor() {
    super('userId or userEmail must be provided');
  }
}

/**
 * Thrown when attempting to assign the `DRIVER` role to a user who has no driver profile.
 * HTTP 400 — code: `DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST`
 */
export class DriverNotFoundForMembershipError extends DomainError {
  code = 'DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST';

  constructor(userEmail: string) {
    super(
      `Cannot create DRIVER membership: No driver profile found for user "${userEmail}". Driver must register their profile first.`,
    );
  }
}
