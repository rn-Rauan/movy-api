import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PlanRepository } from './domain/interfaces/plan.repository';
import { PrismaPlanRepository } from './infrastructure/db/repositories/prisma-plan.repository';
import {
  CreatePlanUseCase,
  DeactivatePlanUseCase,
  FindAllPlansUseCase,
  FindPlanByIdUseCase,
  UpdatePlanUseCase,
} from './application/use-cases';
import { PlanController } from './presentation/controllers/plan.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [PlanController],
  providers: [
    { provide: PlanRepository, useClass: PrismaPlanRepository },
    CreatePlanUseCase,
    UpdatePlanUseCase,
    DeactivatePlanUseCase,
    FindPlanByIdUseCase,
    FindAllPlansUseCase,
  ],
  exports: [PlanRepository],
})
export class PlansModule {}
