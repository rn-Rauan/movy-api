import { InvalidCnhCategoryError } from '../errors';

/**
 * CNH Category Value Object
 *
 * Responsibility:
 * - Encapsulate CNH category validation logic
 * - Ensure only valid categories are used (A, B, C, D, E)
 * - Be immutable and comparable
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
   * Create a new CNH Category instance
   * @param category Category string to validate
   * @throws InvalidCnhCategoryError if category is not valid
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
   * Restore a CNH Category from persistence (skips validation)
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
