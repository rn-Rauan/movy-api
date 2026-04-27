/**
 * Abstract provider contract for one-way password hashing.
 * Bound to {@link BcryptHashProvider} in `AuthModule`.
 */
export abstract class HashProvider {
  /**
   * @param password - Plain text password to hash
   * @returns Hashed password string
   */
  abstract generateHash(password: string): Promise<string>;

  /**
   * @param password - Plain text password to compare
   * @param passwordHash - Stored hashed password
   * @returns true if passwords match
   */
  abstract compare(password: string, passwordHash: string): Promise<boolean>;
}
