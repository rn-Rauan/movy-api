import { InvalidUserNameError, InvalidUserTelephoneError, InvalidPasswordError } from './erros';
import { InvalidEmailError, StringLengthError } from 'src/shared/errors';

/**
 * Serviço de validação para a entidade User
 * Responsável por validar todos os campos do usuário
 * 
 * Princípio SOLID aplicado:
 * - Single Responsibility: apenas valida campos do usuário
 * - Dependency Inversion: pode ser injetado como dependência
 * - Open/Closed: fácil adicionar novas validações sem modificar a entidade
 */
export class UserValidator {
  /**
   * Valida o nome do usuário
   * @param name Nome a ser validado
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
   * Valida o email do usuário
   * @param email Email a ser validado
   * @throws InvalidEmailError
   */
  validateEmail(email: string): void {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    
    if (!emailRegex.test(email)) {
      throw new InvalidEmailError(email);
    }
  }

  /**
   * Valida o hash de senha
   * @param passwordHash Hash da senha a ser validado
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
   * Valida o telefone do usuário
   * Formato esperado: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
   * @param telephone Telefone a ser validado
   * @throws InvalidUserTelephoneError
   */
  validateTelephone(telephone: string): void {
    const telephoneRegex = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;
    
    if (!telephoneRegex.test(telephone)) {
      throw new InvalidUserTelephoneError(telephone);
    }
  }

  /**
   * Valida todos os campos do usuário
   * Útil para validação em massa
   * @throws Pode lançar qualquer um dos erros de validação acima
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
