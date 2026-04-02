import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Erro genérico de validação do User
 */
export abstract class UserValidationError extends DomainError {
  abstract code: string;
}

/**
 * Erro de nome inválido
 */
export class InvalidUserNameError extends UserValidationError {
  code = 'INVALID_USER_NAME';

  constructor(name: string, reason?: string) {
    const message = reason
      ? `Invalid user name "${name}": ${reason}`
      : `Invalid user name "${name}"`;
    super(message);
  }
}

/**
 * Erro de telefone inválido
 */
export class InvalidUserTelephoneError extends UserValidationError {
  code = 'INVALID_USER_TELEPHONE';

  constructor(telephone: string) {
    super(`Invalid telephone format "${telephone}". Expected format: (XX) 9XXXX-XXXX`);
  }
}

/**
 * Erro de senha inválida
 */
export class InvalidPasswordError extends UserValidationError {
  code = 'INVALID_PASSWORD';

  constructor(reason?: string) {
    const message = reason
      ? `Invalid password: ${reason}`
      : 'Invalid password format';
    super(message);
  }
}

/**
 * Erro de usuário não encontrado
 */
export class UserNotFoundError extends DomainError {
  code = 'USER_NOT_FOUND';

  constructor(id?: string) {
    const message = id ? `User with id "${id}" not found` : 'User not found';
    super(message);
  }
}

/**
 * Erro de e-mail já existente
 */
export class UserEmailAlreadyExistsError extends DomainError {
  code = 'USER_EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}

export class InactiveUserError extends DomainError {
  code = 'INACTIVE_USER';
  constructor(id?: string) {
    super(id ? `User with id "${id}" is inactive` : 'User is inactive');
  }
}