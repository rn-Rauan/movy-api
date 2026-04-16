import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { User } from '../../domain/entities';

export class UserPresenter {
  /**
   * Converts a domain User entity to HTTP response DTO format.
   * @param user - User entity
   * @returns UserResponseDto
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
   * Converts a list of User entities to HTTP response DTOs.
   * @param users - Array of User entities
   * @returns Array of UserResponseDto formatted for the API
   */
  static toHTTPList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toHTTP(user));
  }
}
