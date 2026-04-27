import { InvalidPlateError } from '../errors/vehicle.errors';

/** Brazilian plate formats: old (ABC-1234) and Mercosul (ABC1D23) */
const OLD_PLATE_REGEX = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/**
 * Immutable Value Object encapsulating a Brazilian vehicle plate.
 *
 * @remarks
 * Supports two formats:
 * - **Old format**: `ABC1234` — three uppercase letters followed by four digits
 * - **Mercosul format**: `ABC1D23` — three uppercase letters, one digit, one uppercase letter, two digits
 *
 * Both formats are normalised to 7 uppercase characters (hyphen stripped) before validation.
 *
 * @see {@link InvalidPlateError}
 */
export class Plate {
  private readonly value: string;

  private constructor(plate: string) {
    this.value = plate;
  }

  /**
   * Creates a new {@link Plate} instance after validating the Brazilian plate format.
   *
   * @param plate - Raw plate string (e.g. `"ABC-1234"` or `"ABC1D23"`)
   * @returns A normalised, immutable {@link Plate} instance
   * @throws {@link InvalidPlateError} if the plate is empty or does not match any valid format
   */
  static create(plate: string): Plate {
    if (!plate || plate.trim().length === 0) {
      throw new InvalidPlateError(plate, 'Plate cannot be empty');
    }

    const cleaned = plate.trim().toUpperCase().replace('-', '');

    if (cleaned.length !== 7) {
      throw new InvalidPlateError(plate, 'Plate must have 7 characters');
    }

    const isValid =
      OLD_PLATE_REGEX.test(cleaned) || MERCOSUL_PLATE_REGEX.test(cleaned);

    if (!isValid) {
      throw new InvalidPlateError(
        plate,
        'Plate must follow old format (ABC1234) or Mercosul format (ABC1D23)',
      );
    }

    return new Plate(cleaned);
  }

  /**
   * Reconstructs a {@link Plate} from a persisted string without re-running validation.
   *
   * @param plate - Normalised plate string already stored in the database
   * @returns A {@link Plate} instance wrapping the stored value
   */
  static restore(plate: string): Plate {
    return new Plate(plate);
  }

  /** Returns the normalized plate string */
  get value_(): string {
    return this.value;
  }

  /**
   * Check equality against another Plate instance.
   */
  equals(other: Plate): boolean {
    return this === other || this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
