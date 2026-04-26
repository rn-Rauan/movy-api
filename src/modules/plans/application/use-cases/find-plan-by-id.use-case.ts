import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PlanNotFoundError } from '../../domain/errors/plan.errors';

@Injectable()
export class FindPlanByIdUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(id: number) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new PlanNotFoundError(id);
    }
    return plan;
  }
}
