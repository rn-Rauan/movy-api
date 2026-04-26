import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PlanNotFoundError } from '../../domain/errors/plan.errors';

@Injectable()
export class DeactivatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

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
