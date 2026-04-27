import { InvalidCnhError } from '../errors';

/**
 * Value Object representing a Brazilian driver license number (CNH).
 *
 * @remarks
 * Accepts 9–12 alphanumeric characters (trimmed). Use {@link Cnh.create} for
 * new input and {@link Cnh.restore} to reconstruct from persistence without
 * re-validation.
 */
export class Cnh {
  private readonly value: string;

  private constructor(cnh: string) {
    this.value = cnh;
  }

  /**
   * Validates and creates a new {@link Cnh} instance.
   *
   * @param cnh - Raw CNH string (9–12 alphanumeric chars)
   * @returns A valid {@link Cnh} Value Object
   * @throws {@link InvalidCnhError} if the string is empty or out of range
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
   * Reconstructs a {@link Cnh} from a previously validated persisted value.
   * Skips validation — only call with data that already passed `create()`.
   *
   * @param cnh - Persisted CNH string
   * @returns A {@link Cnh} instance
   */
  static restore(cnh: string): Cnh {
    return new Cnh(cnh);
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
