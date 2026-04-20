import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import {
  CreateTripTemplateUseCase,
  UpdateTripTemplateUseCase,
  FindTripTemplateByIdUseCase,
  FindAllTripTemplatesByOrganizationUseCase,
  DeactivateTripTemplateUseCase,
} from './application/use-cases';
import { TripTemplateRepository } from './domain/interfaces';
import { PrismaTripTemplateRepository } from './infrastructure/db/repositories/prisma-trip-template.repository';
import { TripTemplateController } from './presentation/controllers/trip-template.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [TripTemplateController],
  providers: [
    CreateTripTemplateUseCase,
    UpdateTripTemplateUseCase,
    FindTripTemplateByIdUseCase,
    FindAllTripTemplatesByOrganizationUseCase,
    DeactivateTripTemplateUseCase,
    {
      provide: TripTemplateRepository,
      useClass: PrismaTripTemplateRepository,
    },
  ],
  exports: [TripTemplateRepository],
})
export class TripModule {}
