import { InvalidUserNameError, InvalidUserTelephoneError, InvalidPasswordError } from './errors';
import { InvalidEmailError, StringLengthError } from 'src/shared/errors';

/**
 * Validate user entity
 * 
 */
export class UserValidator {
  /**
   * Validate user name
   * @param name Name to be validated
   * @throws InvalidUserNameError
   * @throws StringLengthError
   */
  validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidUserNameError(name, 'Name cannot be empty');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      throw new StringLengthError('name', 3);
    }

    if (trimmedName.length > 255) {
      throw new StringLengthError('name', undefined, 255);
    }
  }

  /**
   * Validate user email
   * @param email Email to be validated
   * @throws InvalidEmailError
   */
  validateEmail(email: string): void {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    
    if (!emailRegex.test(email)) {
      throw new InvalidEmailError(email);
    }
  }

  /**
   * Validate user password hash
   * @param passwordHash Password hash to be validated
   * @throws InvalidPasswordError
   * @throws StringLengthError
   */
  validatePasswordHash(passwordHash: string): void {
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new InvalidPasswordError('Password cannot be empty');
    }

    if (passwordHash.length < 8) {
      throw new StringLengthError('password', 8);
    }
  }

  /**
   * Validate user telephone
   * @param telephone Telephone to be validated
   * @throws InvalidUserTelephoneError
   */
  validateTelephone(telephone: string): void {
    const telephoneRegex = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;
    
    if (!telephoneRegex.test(telephone)) {
      throw new InvalidUserTelephoneError(telephone);
    }
  }

  /**
   * Validate all user fields
   * Useful for batch validation
   * @throws Can throw any of the validation errors above
   */
  validateAll(data: {
    name: string;
    email: string;
    passwordHash: string;
    telephone: string;
  }): void {
    this.validateName(data.name);
    this.validateEmail(data.email);
    this.validatePasswordHash(data.passwordHash);
    this.validateTelephone(data.telephone);
  }
}
