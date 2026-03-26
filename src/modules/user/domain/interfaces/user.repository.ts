import { User } from "../entities";

export abstract class UserRepository {
    abstract save(user: User): Promise<User | null>;
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract update(user: User): Promise<User | null>;
    abstract delete(id: string): Promise<void>;
}