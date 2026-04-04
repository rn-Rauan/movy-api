import { InvalidAddressError } from '../errors';

/**
 * Address Value Object
 *
 * Responsibility:
 * - Encapsulate address validation logic
 * - Guarantee address invariants at type level
 * - Be immutable and comparable
 */
export class Address {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new Address instance
   * @param address Address string to validate
   * @throws InvalidAddressError if address is empty or exceeds length limits
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
