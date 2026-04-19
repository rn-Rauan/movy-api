import { InvalidMoneyError } from 'src/shared/domain/errors';

/**
 * Money Value Object
 *
 * Responsibility:
 * - Encapsulate monetary value validation logic
 * - Guarantee non-negative invariants at type level
 * - Normalize values to 2 decimal places
 * - Be immutable and support arithmetic operations
 */
export class Money {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  /**
   * Create a new Money instance
   * @param value Numeric monetary value (must be >= 0 and finite)
   * @throws InvalidMoneyError if value is negative, NaN, or Infinity
   */
  static create(value: number): Money {
    if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
      throw new InvalidMoneyError(value);
    }

    const normalizedValue = Math.round((value + Number.EPSILON) * 100) / 100;

    return new Money(normalizedValue);
  }

  /**
   * Restore a Money instance from persistence (skips validation)
   */
  static restore(value: number): Money {
    return new Money(value);
  }

  /**
   * Get the numeric monetary value
   */
  get value_(): number {
    return this.value;
  }

  /**
   * Compare two Money instances by value
   */
  equals(other: Money): boolean {
    return this.value === other.value_;
  }

  /**
   * Add another Money value and return a new Money instance
   * @throws InvalidMoneyError if the result is negative
   */
  add(other: Money): Money {
    return Money.create(this.value + other.value_);
  }

  /**
   * Subtract another Money value and return a new Money instance
   * @throws InvalidMoneyError if the result would be negative
   */
  subtract(other: Money): Money {
    const result = this.value - other.value_;

    if (result < 0) {
      throw new InvalidMoneyError(result);
    }

    return Money.create(result);
  }

  /** Returns true when the monetary value is zero */
  isZero(): boolean {
    return this.value === 0;
  }

  /** Returns the raw numeric value */
  toNumber(): number {
    return this.value;
  }

  /** Returns the value formatted to 2 decimal places */
  toString(): string {
    return this.value.toFixed(2);
  }
}
