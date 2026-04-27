import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PlanNotFoundError } from '../../domain/errors/plan.errors';

/**
 * Deactivates a plan, making it unavailable for new subscriptions.
 *
 * Existing subscriptions that reference the plan are **not** cancelled;
 * they remain valid until they naturally expire. Only available in development environments.
 */
@Injectable()
export class DeactivatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  /**
   * Sets the plan's `isActive` flag to `false` and persists the change.
   *
   * @param id - Numeric primary key of the plan to deactivate
   * @returns The updated {@link PlanEntity} with `isActive = false`
   * @throws {@link PlanNotFoundError} if no plan with the given `id` exists
   */
  async execute(id: number) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new PlanNotFoundError(id);
    }

    plan.deactivate();

    const updated = await this.planRepository.update(plan);
    if (!updated) {
      throw new PlanNotFoundError(id);
    }

    return updated;
  }
}
