import { InvalidUserNameError } from '../errors';
import { StringLengthError } from 'src/shared/domain/errors';

/**
 * Immutable Value Object representing a user's display name.
 *
 * @remarks
 * - Name is trimmed before storage and must be 3–255 characters after trimming
 * - Equality is checked by direct string comparison
 *
 * @see {@link InvalidUserNameError}
 */
export class UserName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  /**
   * Creates a new {@link UserName} instance after trimming and validating the name.
   *
   * @param name - Raw name string
   * @returns A new trimmed, immutable {@link UserName} instance
   * @throws {@link InvalidUserNameError} if the name is empty or blank
   * @throws {@link StringLengthError} if the trimmed name is shorter than 3 or longer than 255 characters
   */
  static create(name: string): UserName {
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

    return new UserName(trimmedName);
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
  equals(other: UserName): boolean {
    if (!(other instanceof UserName)) {
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
