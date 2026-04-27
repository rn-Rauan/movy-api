import { UserRepository } from '../../domain/interfaces/user.repository';
import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all users regardless of status.
 *
 * @remarks
 * This use case is restricted to developer endpoints (`DevGuard`) and should
 * not be called from user-facing flows.
 */
@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Find all users with pagination.
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with user entities
   */
  async execute(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    return await this.userRepository.findAll(options);
  }
}
