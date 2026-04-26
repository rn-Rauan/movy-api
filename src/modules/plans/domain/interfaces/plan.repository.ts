import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PlanEntity } from '../entities/plan.entity';
import { PlanName } from './enums/plan-name.enum';

export abstract class PlanRepository {
  abstract save(plan: PlanEntity): Promise<PlanEntity | null>;
  abstract update(plan: PlanEntity): Promise<PlanEntity | null>;
  abstract findById(id: number): Promise<PlanEntity | null>;
  abstract findByName(name: PlanName): Promise<PlanEntity | null>;
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PlanEntity>>;
}
