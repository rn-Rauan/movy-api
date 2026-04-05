import { DomainError } from './domain.error';

/**
 * Erro genérico de validação
 * Usado para validações que podem ocorrer em múltiplos módulos
 */
export class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Erro de validação de email
 */
export class InvalidEmailError extends ValidationError {
  code = 'INVALID_EMAIL';

  constructor(email: string) {
    super(`Email "${email}" is invalid`, 'email');
  }
}

/**
 * Erro de validação de campo requerido
 */
export class RequiredFieldError extends ValidationError {
  code = 'REQUIRED_FIELD';

  constructor(fieldName: string) {
    super(`Field "${fieldName}" is required`, fieldName);
  }
}

/**
 * Erro de validação de comprimento de string
 */
export class StringLengthError extends ValidationError {
  code = 'STRING_LENGTH_ERROR';

  constructor(fieldName: string, minLength?: number, maxLength?: number) {
    let message = `Field "${fieldName}" `;
    if (minLength && maxLength) {
      message += `must be between ${minLength} and ${maxLength} characters`;
    } else if (minLength) {
      message += `must be at least ${minLength} characters`;
    } else if (maxLength) {
      message += `must be less than ${maxLength} characters`;
    }
    super(message, fieldName);
  }
}

/**
 * Erro de validação de telefone
 */
export class InvalidTelephoneError extends ValidationError {
  code = 'INVALID_TELEPHONE';

  constructor(telephone: string) {
    super(`Telephone "${telephone}" is invalid`, 'telephone');
  }
}
