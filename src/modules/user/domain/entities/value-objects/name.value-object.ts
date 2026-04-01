import {
  InvalidUserNameError,
} from '../errors';
import { StringLengthError } from 'src/shared/errors';

/**
 * Name Value Object
 *
 * Responsibility:
 * - Encapsulate name validation logic
 * - Guarantee name invariants at type level
 * - Be immutable and comparable
 */
export class Name {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  /**
   * Create a new Name instance
   * @param name Name string to validate
   * @throws InvalidUserNameError if name is empty
   * @throws StringLengthError if name length is invalid
   */
  static create(name: string): Name {
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

    return new Name(trimmedName);
  }

  /**
   * Get name value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two names
   */
  equals(other: Name): boolean {
    if (!(other instanceof Name)) {
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
