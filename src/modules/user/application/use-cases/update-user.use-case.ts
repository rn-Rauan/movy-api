import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { User } from '../../domain/entities';
import {
  InactiveUserError,
  UserEmailAlreadyExistsError,
  UserNotFoundError,
} from '../../domain/entities/errors/user.errors';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';

/**
 * Partially updates a user's profile fields.
 *
 * @remarks
 * Only provided fields are applied. Email uniqueness is re-checked when
 * a new email is supplied. Password updates are hashed via {@link HashProvider}
 * before being stored. Inactive users cannot be updated.
 *
 * @see {@link UserNotFoundError}
 * @see {@link InactiveUserError}
 * @see {@link UserEmailAlreadyExistsError}
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  /**
   * Update user data partially.
   * @param userId - User ID to be updated
   * @param updateUserDto - Optional fields for update
   * @returns User entity updated
   * @throws UserNotFoundError if the user does not exist
   * @throws InactiveUserError if the user is inactive
   * @throws UserEmailAlreadyExistsError if the new email is already in use
   */
  async execute(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    if (user.status === 'INACTIVE') {
      throw new InactiveUserError(user.id);
    }
    if (updateUserDto.name) {
      user.setName(updateUserDto.name);
    }
    if (updateUserDto.telephone) {
      user.setTelephone(updateUserDto.telephone);
    }
    if (updateUserDto.email) {
      const emailExistis = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (emailExistis && emailExistis.id != user.id) {
        throw new UserEmailAlreadyExistsError(updateUserDto.email);
      }
      user.setEmail(updateUserDto.email);
    }
    if (updateUserDto.password) {
      const newPasswordHash = await this.hashProvider.generateHash(
        updateUserDto.password,
      );
      user.setPasswordHash(newPasswordHash);
    }

    await this.userRepository.update(user);
    return user;
  }
}
