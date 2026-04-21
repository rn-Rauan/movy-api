import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import {
  CreateTripTemplateUseCase,
  UpdateTripTemplateUseCase,
  FindTripTemplateByIdUseCase,
  FindAllTripTemplatesByOrganizationUseCase,
  DeactivateTripTemplateUseCase,
  CreateTripInstanceUseCase,
  FindTripInstanceByIdUseCase,
  FindAllTripInstancesByOrganizationUseCase,
  FindTripInstancesByTemplateUseCase,
  TransitionTripInstanceStatusUseCase,
  AssignDriverToTripInstanceUseCase,
  AssignVehicleToTripInstanceUseCase,
} from './application/use-cases';
import { TripInstanceRepository, TripTemplateRepository } from './domain/interfaces';
import { PrismaTripInstanceRepository } from './infrastructure/db/repositories/prisma-trip-instance.repository';
import { PrismaTripTemplateRepository } from './infrastructure/db/repositories/prisma-trip-template.repository';
import { TripTemplateController } from './presentation/controllers/trip-template.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [TripTemplateController],
  providers: [
    // TripTemplate
    CreateTripTemplateUseCase,
    UpdateTripTemplateUseCase,
    FindTripTemplateByIdUseCase,
    FindAllTripTemplatesByOrganizationUseCase,
    DeactivateTripTemplateUseCase,
    {
      provide: TripTemplateRepository,
      useClass: PrismaTripTemplateRepository,
    },
    // TripInstance
    CreateTripInstanceUseCase,
    FindTripInstanceByIdUseCase,
    FindAllTripInstancesByOrganizationUseCase,
    FindTripInstancesByTemplateUseCase,
    TransitionTripInstanceStatusUseCase,
    AssignDriverToTripInstanceUseCase,
    AssignVehicleToTripInstanceUseCase,
    {
      provide: TripInstanceRepository,
      useClass: PrismaTripInstanceRepository,
    },
  ],
  exports: [TripTemplateRepository, TripInstanceRepository],
})
export class TripModule {}
