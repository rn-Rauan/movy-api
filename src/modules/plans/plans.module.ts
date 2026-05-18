import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PlanRepository } from './domain/interfaces/plan.repository';
import { PrismaPlanRepository } from './infrastructure/db/repositories/prisma-plan.repository';
import {
  CreatePlanUseCase,
  DeactivatePlanUseCase,
  FindAllActivePlansUseCase,
  FindAllPlansUseCase,
  FindPlanByIdUseCase,
  UpdatePlanUseCase,
} from './application/use-cases';
import { PlanController } from './presentation/controllers/plan.controller';
import { PublicPlanController } from './presentation/controllers/public-plan.controller';

/**
 * NestJS module responsible for managing subscription plans on the Movy platform.
 *
 * Exports {@link PlanRepository} so that other modules (e.g. `SubscriptionsModule`)
 * can query and validate plans without importing the full `PlansModule` providers.
 *
 * Write operations require `DevGuard` and are therefore unavailable in production.
 */
@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [PlanController, PublicPlanController],
  providers: [
    { provide: PlanRepository, useClass: PrismaPlanRepository },
    CreatePlanUseCase,
    UpdatePlanUseCase,
    DeactivatePlanUseCase,
    FindPlanByIdUseCase,
    FindAllPlansUseCase,
    FindAllActivePlansUseCase,
  ],
  exports: [PlanRepository],
})
export class PlansModule {}
