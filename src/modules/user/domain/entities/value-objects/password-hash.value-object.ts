import {
  InvalidPasswordError,
} from '../errors';
import { StringLengthError } from 'src/shared/domain/errors';

/**
 * PasswordHash Value Object
 *
 * Responsibility:
 * - Encapsulate password hash validation logic
 * - Guarantee password hash invariants at type level
 * - Be immutable and comparable
 */
export class PasswordHash {
  private readonly value: string;

  private constructor(passwordHash: string) {
    this.value = passwordHash;
  }

  /**
   * Create a new PasswordHash instance
   * @param passwordHash Password hash string to validate
   * @throws InvalidPasswordError if password hash is empty
   * @throws StringLengthError if password hash length is invalid
   */
  static create(passwordHash: string): PasswordHash {
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new InvalidPasswordError('Password cannot be empty');
    }

    if (passwordHash.length < 8) {
      throw new StringLengthError('password', 8);
    }

    return new PasswordHash(passwordHash);
  }

  /**
   * Get password hash value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two password hashes
   */
  equals(other: PasswordHash): boolean {
    if (!(other instanceof PasswordHash)) {
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
