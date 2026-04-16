import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { UserNotFoundError } from '../../domain/entities/errors/user.errors';
import { User } from '../../domain/entities';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Find active user by ID.
   * @param userId - User ID to be found
   * @returns User entity found
   * @throws UserNotFoundError if the user does not exist or is inactive
   */
  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.status === 'INACTIVE') {
      throw new UserNotFoundError(userId);
    }
    return user;
  }
}
