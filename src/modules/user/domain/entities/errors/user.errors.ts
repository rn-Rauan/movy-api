import { DomainError } from 'src/shared/errors/domain.error';

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
