import { InvalidOrganizationNameError } from '../errors';
import { StringLengthError } from 'src/shared/domain/errors';

/**
 * OrganizationName Value Object
 *
 * Responsibility:
 * - Encapsulate organization name validation logic
 * - Guarantee organization name invariants at type level
 * - Be immutable and comparable
 */
export class OrganizationName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  /**
   * Create a new OrganizationName instance
   * @param name Name string to validate
   * @throws InvalidOrganizationNameError if name is empty
   * @throws StringLengthError if name length is invalid
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
