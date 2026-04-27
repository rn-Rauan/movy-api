import { InvalidOrganizationNameError } from '../errors';
import { StringLengthError } from 'src/shared/domain/errors';

/**
 * Value Object representing an organization's display name.
 *
 * @remarks
 * Accepts 2–255 characters (trimmed). Throws distinct errors for empty
 * input ({@link InvalidOrganizationNameError}) and length violations
 * ({@link StringLengthError}).
 */
export class OrganizationName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  /**
   * Validates and creates a new {@link OrganizationName} instance.
   *
   * @param name - Raw name string (2–255 chars, trimmed)
   * @returns A valid {@link OrganizationName} Value Object
   * @throws {@link InvalidOrganizationNameError} if the string is empty
   * @throws {@link StringLengthError} if the trimmed length is outside 2–255
   */
  static create(name: string): OrganizationName {
    if (!name || name.trim().length === 0) {
      throw new InvalidOrganizationNameError(name, 'Name cannot be empty');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      throw new StringLengthError('organization name', 2);
    }

    if (trimmedName.length > 255) {
      throw new StringLengthError('organization name', undefined, 255);
    }

    return new OrganizationName(trimmedName);
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
  equals(other: OrganizationName): boolean {
    if (!(other instanceof OrganizationName)) {
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
