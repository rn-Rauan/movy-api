import { CnhCategories } from 'src/modules/driver/domain/entities/value-objects';
import { InvalidCnhCategoriesError } from 'src/modules/driver/domain/entities/errors/driver.errors';

describe('CnhCategories', () => {
  describe('create — happy paths', () => {
    it('accepts a single valid category', () => {
      const vo = CnhCategories.create(['B']);
      expect([...vo.values]).toEqual(['B']);
    });

    it('accepts multiple valid categories', () => {
      const vo = CnhCategories.create(['A', 'B']);
      expect([...vo.values]).toEqual(['A', 'B']);
    });

    it('sorts values alphabetically', () => {
      const vo = CnhCategories.create(['B', 'A', 'D']);
      expect([...vo.values]).toEqual(['A', 'B', 'D']);
    });

    it('deduplicates repeated values', () => {
      const vo = CnhCategories.create(['B', 'B', 'A']);
      expect([...vo.values]).toEqual(['A', 'B']);
    });

    it('normalises case and trims whitespace', () => {
      const vo = CnhCategories.create(['a', ' b ', 'C']);
      expect([...vo.values]).toEqual(['A', 'B', 'C']);
    });
  });

  describe('create — error paths', () => {
    it('throws on empty array', () => {
      expect(() => CnhCategories.create([])).toThrow(InvalidCnhCategoriesError);
    });

    it('throws on unknown category', () => {
      expect(() => CnhCategories.create(['Z'])).toThrow(
        InvalidCnhCategoriesError,
      );
    });

    it('throws when an item is empty string', () => {
      expect(() => CnhCategories.create([''])).toThrow(
        InvalidCnhCategoriesError,
      );
    });

    it('throws when any item is invalid even if others are valid', () => {
      expect(() => CnhCategories.create(['A', 'B', 'Z'])).toThrow(
        InvalidCnhCategoriesError,
      );
    });
  });

  describe('restore', () => {
    it('reconstructs without validation', () => {
      const vo = CnhCategories.restore(['A', 'B']);
      expect([...vo.values]).toEqual(['A', 'B']);
    });
  });

  describe('has', () => {
    it('returns true for held category', () => {
      const vo = CnhCategories.create(['A', 'B']);
      expect(vo.has('A')).toBe(true);
      expect(vo.has('B')).toBe(true);
    });

    it('returns false for non-held category', () => {
      const vo = CnhCategories.create(['A']);
      expect(vo.has('B')).toBe(false);
    });
  });

  describe('equals', () => {
    it('compares structurally regardless of input order', () => {
      const a = CnhCategories.create(['A', 'B']);
      const b = CnhCategories.create(['B', 'A']);
      expect(a.equals(b)).toBe(true);
    });

    it('is false for different categories', () => {
      const a = CnhCategories.create(['A', 'B']);
      const b = CnhCategories.create(['A', 'C']);
      expect(a.equals(b)).toBe(false);
    });

    it('is false for different sizes', () => {
      const a = CnhCategories.create(['A', 'B']);
      const b = CnhCategories.create(['A']);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('isValid', () => {
    it('returns true for valid input', () => {
      expect(CnhCategories.isValid(['A', 'B'])).toBe(true);
    });

    it('returns false for invalid input', () => {
      expect(CnhCategories.isValid([])).toBe(false);
      expect(CnhCategories.isValid(['Z'])).toBe(false);
    });
  });

  describe('toString', () => {
    it('joins sorted values with commas', () => {
      expect(CnhCategories.create(['B', 'A']).toString()).toBe('A,B');
    });
  });
});
