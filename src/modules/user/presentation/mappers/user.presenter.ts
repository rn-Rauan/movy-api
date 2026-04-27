import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { User } from '../../domain/entities';

/**
 * Serialises a {@link User} domain object into the HTTP response shape {@link UserResponseDto}.
 *
 * Intentionally excludes `passwordHash` from the response.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class UserPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param user - The {@link User} to serialise
   * @returns A {@link UserResponseDto} safe to include in an HTTP response
   */
  static toHTTP(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param users - Array of {@link User} instances to serialise
   * @returns Array of {@link UserResponseDto} objects
   */
  static toHTTPList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toHTTP(user));
  }
}
