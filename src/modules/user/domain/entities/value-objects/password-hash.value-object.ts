import { InvalidPasswordError } from '../errors';
import { StringLengthError } from 'src/shared/domain/errors';

/**
 * Immutable Value Object wrapping a bcrypt password hash string.
 *
 * @remarks
 * - Validates that the hash is non-empty and at least 8 characters long
 * - The raw plaintext password is hashed by {@link HashProvider} before being
 *   passed to `create()` — this VO never stores or receives a plaintext password
 * - Equality is checked by direct string comparison of the stored hash
 *
 * @see {@link InvalidPasswordError}
 */
export class PasswordHash {
  private readonly value: string;

  private constructor(passwordHash: string) {
    this.value = passwordHash;
  }

  /**
   * Creates a new {@link PasswordHash} instance after validating the hash string.
   *
   * @returns A new immutable {@link PasswordHash} instance
   * @throws {@link InvalidPasswordError} if the hash string is empty
   * @throws {@link StringLengthError} if the hash is shorter than 8 characters
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
