import { UserRepository } from '../../domain/interfaces/user.repository';
import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    return await this.userRepository.findAll(options);
  }
}
