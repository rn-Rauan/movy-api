import { InvalidCnhCategoriesError } from '../errors';

/**
 * Single CNH category according to DETRAN: A, B, C, D, or E.
 */
export type CnhCategoryType = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Collection Value Object representing the set of CNH categories held by a driver.
 *
 * @remarks
 * A driver may legally hold several categories simultaneously (e.g. `A` + `B`).
 * Internally the values are deduplicated and sorted alphabetically so that two
 * instances built from inputs like `['B', 'A']` and `['A', 'B']` compare equal.
 *
 * Use {@link CnhCategories.create} for new input and {@link CnhCategories.restore}
 * to reconstruct from persistence without re-validation.
 */
export class CnhCategories {
  private readonly _values: readonly CnhCategoryType[];

  private constructor(values: readonly CnhCategoryType[]) {
    this._values = Object.freeze([...values]);
  }

  private static readonly VALID_CATEGORIES: readonly CnhCategoryType[] = [
    'A',
    'B',
    'C',
    'D',
    'E',
  ];

  /**
   * Validates and creates a {@link CnhCategories} instance.
   *
   * Input is normalised: each item is trimmed and upper-cased; duplicates are
   * removed; the resulting list is sorted alphabetically.
   *
   * @param values - Raw category strings (case-insensitive). Must contain at
   *   least one element and every item must be in `A–E`.
   * @returns A valid {@link CnhCategories} Value Object
   * @throws {@link InvalidCnhCategoriesError} if `values` is empty or contains
   *   an unknown category.
   */
  static create(values: readonly string[]): CnhCategories {
    if (!Array.isArray(values) || values.length === 0) {
      throw new InvalidCnhCategoriesError(
        values,
        'at least one category required',
      );
    }

    const normalised = values.map((raw) => {
      if (!raw || typeof raw !== 'string') {
        throw new InvalidCnhCategoriesError(
          values,
          `invalid item: ${String(raw)}`,
        );
      }
      const trimmed = raw.trim().toUpperCase();
      if (!this.VALID_CATEGORIES.includes(trimmed as CnhCategoryType)) {
        throw new InvalidCnhCategoriesError(values, `unknown category: ${raw}`);
      }
      return trimmed as CnhCategoryType;
    });

    const unique = Array.from(new Set(normalised)).sort();

    return new CnhCategories(unique);
  }

  /**
   * Reconstructs a {@link CnhCategories} from previously validated persisted
   * data. Skips validation — only call with data that already passed `create()`.
   */
  static restore(values: readonly CnhCategoryType[]): CnhCategories {
    return new CnhCategories(values);
  }

  /**
   * Ordered, deduplicated list of held categories.
   */
  get values(): readonly CnhCategoryType[] {
    return this._values;
  }

  /**
   * Whether the driver holds the given category.
   */
  has(category: CnhCategoryType): boolean {
    return this._values.includes(category);
  }

  /**
   * Structural equality based on sorted values.
   */
  equals(other: CnhCategories): boolean {
    if (this === other) return true;
    if (this._values.length !== other._values.length) return false;
    return this._values.every((v, i) => v === other._values[i]);
  }

  toString(): string {
    return this._values.join(',');
  }

  /**
   * Lightweight validity check — returns true if `create()` would succeed.
   */
  static isValid(values: readonly string[]): boolean {
    try {
      this.create(values);
      return true;
    } catch {
      return false;
    }
  }
}
