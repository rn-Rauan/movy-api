import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PaginationOptions } from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of plans where `isActive = true`. Used by the public
 * catalogue endpoint that unauthenticated visitors hit during signup.
 */
@Injectable()
export class FindAllActivePlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(options: PaginationOptions) {
    return this.planRepository.findAllActive(options);
  }
}
