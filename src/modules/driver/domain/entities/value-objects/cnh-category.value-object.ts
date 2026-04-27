import { InvalidCnhCategoryError } from '../errors';

/**
 * Value Object representing a Brazilian CNH license category.
 *
 * @remarks
 * Only the DETRAN categories `A`, `B`, `C`, `D`, and `E` are accepted.
 * Use {@link CnhCategory.create} for new input and {@link CnhCategory.restore}
 * to reconstruct from persistence without re-validation.
 */
export type CnhCategoryType = 'A' | 'B' | 'C' | 'D' | 'E';

export class CnhCategory {
  private readonly value: CnhCategoryType;

  private constructor(category: CnhCategoryType) {
    this.value = category;
  }

  private static readonly VALID_CATEGORIES: readonly CnhCategoryType[] = [
    'A',
    'B',
    'C',
    'D',
    'E',
  ];

  /**
   * Validates and creates a new {@link CnhCategory} instance.
   *
   * @param category - Raw category string (case-insensitive)
   * @returns A valid {@link CnhCategory} Value Object
   * @throws {@link InvalidCnhCategoryError} if the value is not in `A–E`
   */
  static create(category: string): CnhCategory {
    if (!category || typeof category !== 'string') {
      throw new InvalidCnhCategoryError(String(category));
    }

    const trimmedCategory = category.trim().toUpperCase();

    if (!this.VALID_CATEGORIES.includes(trimmedCategory as CnhCategoryType)) {
      throw new InvalidCnhCategoryError(category);
    }

    return new CnhCategory(trimmedCategory as CnhCategoryType);
  }

  /**
   * Reconstructs a {@link CnhCategory} from a previously validated persisted value.
   * Skips validation — only call with data that already passed `create()`.
   *
   * @param category - Persisted category string
   * @returns A {@link CnhCategory} instance
   */
  static restore(category: CnhCategoryType): CnhCategory {
    return new CnhCategory(category);
  }

  /**
   * Get category value
   */
  get value_(): CnhCategoryType {
    return this.value;
  }

  /**
   * Check if category is valid
   */
  static isValid(category: string): boolean {
    try {
      this.create(category);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compare two CNH Category instances
   */
  equals(other: CnhCategory): boolean {
    return this === other || this.value === other.value;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }
}
