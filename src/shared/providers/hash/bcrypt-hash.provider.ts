import { Injectable } from "@nestjs/common";
import { HashProvider } from "../interfaces/hash.interface";
import * as bcrypt from 'bcrypt'

@Injectable()
export class BcryptHashProvider implements HashProvider{
    generateHash(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }
    compare(password: string, passwordHash: string): Promise<boolean> {
        return bcrypt.compare(password, passwordHash);
    }

}