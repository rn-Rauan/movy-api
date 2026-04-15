import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { User } from '../../domain/entities';

export class UserPresenter {
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
  static toHTTPList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toHTTP(user));
  }
}
