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

  /**
   * Find all active users with pagination.
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with active user entities
   */
  async execute(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    const users = await this.userRepository.findAllActive(options);
    return users;
  }
}
