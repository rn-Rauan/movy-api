import { User } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Abstract repository contract for the {@link User} aggregate.
 *
 * @remarks
 * The concrete implementation ({@link PrismaUserRepository}) is bound to this token
 * inside {@link UserModule} and exported for use by {@link AuthModule} and other consumers.
 */
export abstract class UserRepository {
  /**
   * Inserts a new user row into the persistence layer.
   *
   * @param user - The {@link User} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(user: User): Promise<User | null>;

  /**
   * Finds a user by UUID.
   *
   * @param id - UUID of the user
   * @returns The matching {@link User}, or `null` if not found
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their unique email address.
   *
   * @param email - The user's email string
   * @returns The matching {@link User}, or `null` if not found
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Updates an existing user row with the entity's current state.
   *
   * @param user - The {@link User} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(user: User): Promise<User | null>;

  /**
   * Returns a paginated list of `ACTIVE` users, ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link User} items
   */
  abstract findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>>;

  /**
   * Returns a paginated list of all users regardless of status,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of all {@link User} items
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>>;

  /**
   * Hard-deletes a user row from the persistence layer.
   *
   * @param id - UUID of the user to delete
   */
  abstract delete(id: string): Promise<void>;
}
