import { InvalidCnhError } from '../errors';

/**
 * CNH Value Object
 *
 * Responsibility:
 * - Encapsulate CNH validation logic
 * - Guarantee CNH invariants at type level
 * - Be immutable and comparable
 */
export class Cnh {
  private readonly value: string;

  private constructor(cnh: string) {
    this.value = cnh;
  }

  /**
   * Create a new CNH instance
   * @param cnh CNH string to validate
   * @throws InvalidCnhError if CNH format is invalid
   */
  static create(cnh: string): Cnh {
    if (!cnh || cnh.trim().length === 0) {
      throw new InvalidCnhError(cnh, 'CNH cannot be empty');
    }

    const trimmedCnh = cnh.trim();

    if (trimmedCnh.length < 9 || trimmedCnh.length > 12) {
      throw new InvalidCnhError(cnh, 'CNH must be between 9 and 12 characters');
    }

    // Validate alphanumeric only
    if (!/^[a-zA-Z0-9]+$/.test(trimmedCnh)) {
      throw new InvalidCnhError(
        cnh,
        'CNH must contain only alphanumeric characters',
      );
    }

    return new Cnh(trimmedCnh);
  }

  /**
   * Get CNH value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two CNH instances
   */
  equals(other: Cnh): boolean {
    return this === other || this.value === other.value;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }
}
