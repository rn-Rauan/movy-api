import { InvalidAddressError } from '../errors';

/**
 * Value Object representing a free-form address string.
 *
 * @remarks
 * Accepts any non-empty string up to 255 characters.
 * Used for the organization's physical address field.
 */
export class Address {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Validates and creates a new {@link Address} instance.
   *
   * @param address - Raw address string (non-empty, max 255 chars)
   * @returns A valid {@link Address} Value Object
   * @throws {@link InvalidAddressError} if the string is empty or exceeds 255 characters
   */
  static create(address: string): Address {
    if (!address || address.trim().length === 0) {
      throw new InvalidAddressError('Address should not be empty.');
    }

    if (address.length > 255) {
      throw new InvalidAddressError(
        'Address should not exceed 255 characters.',
      );
    }

    return new Address(address);
  }

  get value_(): string {
    return this.value;
  }

  equals(other: Address): boolean {
    return this.value === other.value_;
  }

  toString(): string {
    return this.value;
  }
}
