import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SubscriptionRepository } from './domain/interfaces/subscription.repository';
import { PrismaSubscriptionRepository } from './infrastructure/db/repositories/prisma-subscription.repository';
import {
  CancelSubscriptionUseCase,
  FindActiveSubscriptionUseCase,
  FindSubscriptionsByOrganizationUseCase,
  SubscribeToPlanUseCase,
} from './application/use-cases';
import { SubscriptionController } from './presentation/controllers/subscription.controller';

@Module({
  imports: [PrismaModule, SharedModule, PlansModule],
  controllers: [SubscriptionController],
  providers: [
    { provide: SubscriptionRepository, useClass: PrismaSubscriptionRepository },
    SubscribeToPlanUseCase,
    CancelSubscriptionUseCase,
    FindActiveSubscriptionUseCase,
    FindSubscriptionsByOrganizationUseCase,
  ],
  exports: [SubscriptionRepository],
})
export class SubscriptionsModule {}
