import { Injectable } from '@nestjs/common';
import { HashProvider } from '../interfaces/hash.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptHashProvider implements HashProvider {
  /**
   * @param password - Plain text password to hash
   * @returns Bcrypt-hashed password (10 salt rounds)
   */
  generateHash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * @param password - Plain text password
   * @param passwordHash - Bcrypt hash to compare against
   * @returns true if passwords match
   */
  compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
