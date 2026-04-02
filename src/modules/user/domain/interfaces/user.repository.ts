import { User } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/types/interfaces';

export abstract class UserRepository {
  abstract save(user: User): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract update(user: User): Promise<User | null>;
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>>;
  abstract delete(id: string): Promise<void>;
}
