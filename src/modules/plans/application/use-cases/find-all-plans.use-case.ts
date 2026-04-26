import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../domain/interfaces/plan.repository';
import { PaginationOptions } from 'src/shared/domain/interfaces';

@Injectable()
export class FindAllPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(options: PaginationOptions) {
    return this.planRepository.findAll(options);
  }
}
