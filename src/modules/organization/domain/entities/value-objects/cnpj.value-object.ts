import { InvalidCnpjError } from '../errors';

/**
 * Value Object representing a Brazilian CNPJ (company tax ID).
 *
 * @remarks
 * Accepts the raw 14-digit string or the masked `XX.XXX.XXX/XXXX-XX` format.
 * The stored value is always formatted as `XX.XXX.XXX/XXXX-XX`.
 * Use {@link Cnpj.create} for new input; there is no `restore()` because the
 * formatted value always passes validation.
 */
export class Cnpj {
  private readonly value: string;

  private constructor(cnpj: string) {
    this.value = cnpj;
  }

  /**
   * Validates, normalises, and formats a CNPJ string.
   *
   * @param cnpj - Raw CNPJ string (digits or masked)
   * @returns A valid {@link Cnpj} Value Object (stored as `XX.XXX.XXX/XXXX-XX`)
   * @throws {@link InvalidCnpjError} if the digit verification fails
   */
  static create(cnpj: string): Cnpj {
    // 1. normalization: remove máscara e espaços para validação
    const cleanCnpj = cnpj.replace(/[./\s-]/g, '');

    // 2. validation based on cleaned value: check for common errors
    if (!Cnpj.isValid(cleanCnpj)) {
      throw new InvalidCnpjError(cleanCnpj);
    }

    // 3. format as Value Object standard
    const formatted = Cnpj.format(cleanCnpj);
    return new Cnpj(formatted);
  }

  static isValid(cnpj: string): boolean {
    if (!cnpj) return false;

    if (cnpj.length !== 14) return false;

    if (/^(\w)\1+$/.test(cnpj)) return false;

    if (/^\d{14}$/.test(cnpj)) {
      const calculateDigit = (slice: string): number => {
        const weights =
          slice.length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        const sum = slice
          .split('')
          .reduce(
            (acc, digit, index) => acc + parseInt(digit, 10) * weights[index],
            0,
          );

        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
      };

      const firstDigit = calculateDigit(cnpj.substring(0, 12));
      if (parseInt(cnpj.charAt(12), 10) !== firstDigit) return false;

      const secondDigit = calculateDigit(cnpj.substring(0, 13));
      if (parseInt(cnpj.charAt(13), 10) !== secondDigit) return false;
    }

    return true;
  }

  private static format(cleanCnpj: string): string {
    return cleanCnpj.replace(
      /^(\w{2})(\w{3})(\w{3})(\w{4})(\w{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  /**
   * Get CNPJ value
   */
  get value_(): string {
    return this.value;
  }

  /**
   * Compare two CNPJs
   */
  equals(other: Cnpj): boolean {
    if (!(other instanceof Cnpj)) {
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
