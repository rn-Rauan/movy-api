import { InvalidTelephoneError } from '../../errors';

/**
 * Telephone Value Object
 *
 * Responsibility:
 * - Encapsulate telephone validation logic
 * - Guarantee telephone invariants at type level
 * - Be immutable and comparable
 */
export class Telephone {
  private readonly value: string;

  private constructor(telephone: string) {
    this.value = telephone;
  }

  /**
   * Create a new Telephone instance
   * @param telephone Telephone string to validate
   * @throws InvalidTelephoneError if telephone format is invalid
   */
  static create(telephone: string): Telephone {
    const telephoneRegex = /^\+?[1-9]\d{6,14}$/;

    if (!telephoneRegex.test(telephone)) {
      throw new InvalidTelephoneError(telephone);
    }

    return new Telephone(telephone);
  }

  /**
   * Restore a Telephone from persistence (skips validation)
   */
  static restore(telephone: string): Telephone {
    return new Telephone(telephone);
  }

  /**
   * Get telephone value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two telephones
   */
  equals(other: Telephone): boolean {
    if (!(other instanceof Telephone)) {
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
