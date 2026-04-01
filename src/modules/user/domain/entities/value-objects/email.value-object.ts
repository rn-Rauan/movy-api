import { InvalidEmailError } from 'src/shared/errors';

/**
 * Email Value Object
 *
 * Responsibility:
 * - Encapsulate email validation logic
 * - Guarantee email invariants at type level
 * - Be immutable and comparable
 */
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Create a new Email instance
   * @param email Email string to validate
   * @throws InvalidEmailError if email format is invalid
   */
  static create(email: string): Email {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

    if (!emailRegex.test(email)) {
      throw new InvalidEmailError(email);
    }

    return new Email(email);
  }

  /**
   * Get email value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two emails
   */
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }
}
