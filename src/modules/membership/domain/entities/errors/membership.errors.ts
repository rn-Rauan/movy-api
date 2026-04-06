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
