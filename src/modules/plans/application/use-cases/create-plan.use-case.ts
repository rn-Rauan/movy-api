import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import {
  PlanAlreadyExistsError,
  PlanCreationFailedError,
} from '../../domain/errors/plan.errors';
import { CreatePlanDto } from '../dtos';

@Injectable()
export class CreatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(dto: CreatePlanDto) {
    const existing = await this.planRepository.findByName(dto.name);
    if (existing) {
      throw new PlanAlreadyExistsError(dto.name);
    }

    const plan = PlanEntity.create({
      name: dto.name,
      price: Money.create(dto.price),
      maxVehicles: dto.maxVehicles,
      maxDrivers: dto.maxDrivers,
      maxMonthlyTrips: dto.maxMonthlyTrips,
    });

    const saved = await this.planRepository.save(plan);
    if (!saved) {
      throw new PlanCreationFailedError();
    }

    return saved;
  }
}
