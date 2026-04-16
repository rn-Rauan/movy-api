import { User } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

export abstract class UserRepository {
  /**
   * Persists a new user in the database.
   * @param user - User entity to be saved
   * @returns Persisted User entity or null in case of failure
   */
  abstract save(user: User): Promise<User | null>;

  /**
   * Finds a user by ID.
   * @param id - UUID of the user to be found
   * @returns User entity or null if not found
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Finds a user by email.
   * @param email - Email of the user
   * @returns User entity or null if not found
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Updates an existing user's data.
   * @param user - User entity with updated data
   * @returns Updated User entity or null in case of failure
   */
  abstract update(user: User): Promise<User | null>;

  /**
   * Finds all active users with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with active User entities
   */
  abstract findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>>;

  /**
   * Finds all users with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with all User entities
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>>;

  /**
   * Deletes a user by ID permanently.
   * @param id - UUID of the user to be deleted
   */
  abstract delete(id: string): Promise<void>;
}
