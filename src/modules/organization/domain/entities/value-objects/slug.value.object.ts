import { InvalidSlugError } from '../errors';

/**
 * Slug Value Object
 *
 * Responsibility:
 * - Encapsulate slug validation logic
 * - Guarantee slug invariants at type level
 * - Be immutable and comparable
 */
export class Slug {
  private readonly value: string;

  private constructor(slug: string) {
    this.value = slug;
  }

  /**
   * Create a new Slug instance
   * @param slug Slug string to validate
   * @throws InvalidSlugError if slug format is invalid
   */
  static create(slug: string): Slug {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!slugRegex.test(slug)) {
      throw new InvalidSlugError(slug);
    }

    return new Slug(slug);
  }

  /**
   * Get slug value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two slugs
   */
  equals(other: Slug): boolean {
    if (!(other instanceof Slug)) {
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
