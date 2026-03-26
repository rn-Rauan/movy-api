import { User } from "../entities";

export interface IUserRepository {
    create(user: User): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(user: User): Promise<User | null>;
    delete(id: string): Promise<void>;
}