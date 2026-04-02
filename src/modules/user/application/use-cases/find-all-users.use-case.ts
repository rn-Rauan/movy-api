import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { User } from '../../domain/entities';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/types/interfaces';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    const users = await this.userRepository.findAll(options);
    return users;
  }
}
