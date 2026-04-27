import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PlanNotFoundError } from '../../domain/errors/plan.errors';

/**
 * Retrieves a single plan by its numeric primary key.
 *
 * Used by the `GET /plans/:id` endpoint and also called internally when the
 * subscription flow needs to validate that a plan is active before subscribing.
 */
@Injectable()
export class FindPlanByIdUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  /**
   * Looks up the plan and throws if it does not exist.
   *
   * @param id - Numeric primary key of the plan
   * @returns The matching {@link PlanEntity}
   * @throws {@link PlanNotFoundError} if no plan with the given `id` exists
   */
  async execute(id: number) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new PlanNotFoundError(id);
    }
    return plan;
  }
}
