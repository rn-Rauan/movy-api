import { DomainError } from './domain.error';

/**
 * Generic validation error — base class for all field-level constraint errors.
 * Optionally carries the name of the failing `field` property.
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
 * Thrown when an email string fails RFC 5321 format validation.
 */
export class InvalidEmailError extends ValidationError {
  code = 'INVALID_EMAIL';

  constructor(email: string) {
    super(`Email "${email}" is invalid`, 'email');
  }
}

/**
 * Thrown when a required field is missing or empty.
 */
export class RequiredFieldError extends ValidationError {
  code = 'REQUIRED_FIELD';

  constructor(fieldName: string) {
    super(`Field "${fieldName}" is required`, fieldName);
  }
}

/**
 * Thrown when a string field violates minimum or maximum length constraints.
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
 * Thrown when a phone number string fails E.164-like international format validation.
 * Accepted pattern: optional `+` prefix, 7–15 digits, no spaces or formatting chars.
 */
export class InvalidTelephoneError extends ValidationError {
  code = 'INVALID_TELEPHONE';

  constructor(telephone: string) {
    super(`Telephone "${telephone}" is invalid`, 'telephone');
  }
}

/**
 * Thrown when a numeric monetary value is negative, `NaN`, or `Infinity`.
 */
export class InvalidMoneyError extends ValidationError {
  code = 'INVALID_MONEY';

  constructor(money: number) {
    super(`Money "${money}" is invalid`, 'money');
  }
}
