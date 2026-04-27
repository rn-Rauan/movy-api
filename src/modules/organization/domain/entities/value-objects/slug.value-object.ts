import { InvalidSlugError } from '../errors';

/**
 * Value Object representing a URL-safe slug for an organization.
 *
 * @remarks
 * Only lowercase letters, digits, and hyphens are accepted.
 * Must follow the pattern `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` — no leading/trailing
 * hyphens and no consecutive hyphens.
 */
export class Slug {
  private readonly value: string;

  private constructor(slug: string) {
    this.value = slug;
  }

  /**
   * Validates and creates a new {@link Slug} instance.
   *
   * @param slug - Raw slug string (lowercase, digits, hyphens)
   * @returns A valid {@link Slug} Value Object
   * @throws {@link InvalidSlugError} if the string does not match the slug pattern
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
