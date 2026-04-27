import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import {
  PlanAlreadyExistsError,
  PlanCreationFailedError,
} from '../../domain/errors/plan.errors';
import { CreatePlanDto } from '../dtos';

/**
 * Creates a new subscription plan on the platform.
 *
 * Enforces name uniqueness before persisting the entity.
 * This use case is only invoked from the development-only `POST /plans` endpoint.
 *
 * @remarks
 * The write endpoint is protected by `DevGuard` so this use case will not run
 * in production unless the guard is bypassed.
 */
@Injectable()
export class CreatePlanUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  /**
   * Validates uniqueness and persists the new plan.
   *
   * @param dto - Validated input data for the new plan
   * @returns The newly created {@link PlanEntity} with the database-assigned `id`
   * @throws {@link PlanAlreadyExistsError} if a plan with the same `name` already exists
   * @throws {@link PlanCreationFailedError} if the repository fails to persist the entity
   */
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
      durationDays: dto.durationDays,
    });

    const saved = await this.planRepository.save(plan);
    if (!saved) {
      throw new PlanCreationFailedError();
    }

    return saved;
  }
}
