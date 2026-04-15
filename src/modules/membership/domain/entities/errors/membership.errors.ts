import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Erro de Membership não encontrada
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
 * Erro de Membership já existe
 */
export class MembershipAlreadyExistsError extends DomainError {
  code = 'MEMBERSHIP_ALREADY_EXISTS';

  constructor(userId: string, roleId: number, organizationId: string) {
    super(
      `Membership for user "${userId}", role "${roleId}" and organization "${organizationId}" already exists.`,
    );
  }
}

export class UserNotFoundForMembershipError extends DomainError {
  code = 'USER_FOR_MEMBERSHIP_NOT_FOUND';

  constructor(email: string) {
    super(`User with email "${email}" not found`);
  }
}

export class MembershipMissingIdentifierError extends DomainError {
  code = 'MEMBERSHIP_MISSING_IDENTIFIER_BAD_REQUEST';

  constructor() {
    super('userId or userEmail must be provided');
  }
}

export class DriverNotFoundForMembershipError extends DomainError {
  code = 'DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST';

  constructor(userEmail: string) {
    super(
      `Cannot create DRIVER membership: No driver profile found for user "${userEmail}". Driver must register their profile first.`,
    );
  }
}
