import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PaginationOptions } from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all plans ordered by `id` ascending.
 *
 * This use case is publicly accessible — it does not require an admin role
 * because the plan catalogue is intended to be visible to all authenticated users.
 */
@Injectable()
export class FindAllPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  /**
   * Fetches all plans from the repository with pagination.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} containing the requested page of {@link PlanEntity} items
   */
  async execute(options: PaginationOptions) {
    return this.planRepository.findAll(options);
  }
}
