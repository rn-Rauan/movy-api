import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PlanNotFoundError } from '../../domain/errors/plan.errors';
import { UpdatePlanDto } from '../dtos';

@Injectable()
export class UpdatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(id: number, dto: UpdatePlanDto) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new PlanNotFoundError(id);
    }

    plan.update({
      price: dto.price !== undefined ? Money.create(dto.price) : undefined,
      maxVehicles: dto.maxVehicles,
      maxDrivers: dto.maxDrivers,
      maxMonthlyTrips: dto.maxMonthlyTrips,
    });

    const updated = await this.planRepository.update(plan);
    if (!updated) {
      throw new PlanNotFoundError(id);
    }

    return updated;
  }
}
