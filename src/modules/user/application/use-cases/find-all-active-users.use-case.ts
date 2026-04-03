import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { User } from '../../domain/entities';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindAllActiveUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    const users = await this.userRepository.findAllActive(options);
    return users;
  }
}
