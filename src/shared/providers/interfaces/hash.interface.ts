export abstract class HashProvider {
  /**
   *
   * @param password
   * @returns passwordHash
   */
  abstract generateHash(password: string): Promise<string>;

  /**
   *
   * @param password
   * @param passwordHash
   * @returns boolean
   */
  abstract compare(password: string, passwordHash: string): Promise<boolean>;
}
