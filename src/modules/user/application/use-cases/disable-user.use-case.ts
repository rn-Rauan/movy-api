import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import {
  InactiveUserError,
  UserNotFoundError,
} from '../../domain/entities/errors/user.errors';
import { User } from '../../domain/entities';

/**
 * Soft-deletes a user by setting their status to `INACTIVE`.
 *
 * @remarks
 * The user record is NOT hard-deleted; inactive users are simply excluded
 * from normal queries. Re-activation is not exposed as a use case — only a
 * developer endpoint bypasses this.
 *
 * @see {@link UserNotFoundError}
 * @see {@link InactiveUserError}
 */
@Injectable()
export class DisableUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Disable (soft delete) a user by ID.
   * @param userId - User ID to be disabled
   * @returns User entity with status INACTIVE
   * @throws UserNotFoundError if the user does not exist
   * @throws InactiveUserError if the user is already inactive
   */
  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    if (user.status === 'INACTIVE') {
      throw new InactiveUserError(user.id);
    }

    user.setStatus('INACTIVE');
    await this.userRepository.update(user);
    return user;
  }
}
