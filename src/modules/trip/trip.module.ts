import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { DriverModule } from 'src/modules/driver/driver.module';
import { VehicleModule } from 'src/modules/vehicle/vehicle.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
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
  FindPublicTripInstancesUseCase,
  FindPublicTripInstancesByOrgSlugUseCase,
  FindPublicTripInstanceByIdUseCase,
} from './application/use-cases';
import {
  TripInstanceRepository,
  TripTemplateRepository,
  PublicTripQueryService,
} from './domain/interfaces';
import { PrismaTripInstanceRepository } from './infrastructure/db/repositories/prisma-trip-instance.repository';
import { PrismaTripTemplateRepository } from './infrastructure/db/repositories/prisma-trip-template.repository';
import { PrismaPublicTripQueryService } from './infrastructure/db/services/prisma-public-trip-query.service';
import { TripInstanceController } from './presentation/controllers/trip-instance.controller';
import { TripTemplateController } from './presentation/controllers/trip-template.controller';
import { PublicTripInstanceController } from './presentation/controllers/public-trip-instance.controller';

/**
 * NestJS module that manages trip blueprints ({@link TripTemplate}) and their scheduled
 * executions ({@link TripInstance}).
 *
 * Imports:
 * - `DriverModule` — provides {@link DriverRepository} for driver assignment validation
 * - `VehicleModule` — provides {@link VehicleRepository} for vehicle assignment validation
 *
 * Exports:
 * - `TripTemplateRepository` — consumed by {@link BookingsModule} to resolve pricing
 * - `TripInstanceRepository` — consumed by {@link BookingsModule} for capacity checks
 */
/**
 * NestJS module that manages trip blueprints ({@link TripTemplate}) and their scheduled
 * executions ({@link TripInstance}).
 *
 * Imports:
 * - `DriverModule` — provides {@link DriverRepository} for driver assignment validation
 * - `VehicleModule` — provides {@link VehicleRepository} for vehicle assignment validation
 *
 * Exports:
 * - `TripTemplateRepository` — consumed by {@link BookingsModule} to resolve pricing
 * - `TripInstanceRepository` — consumed by {@link BookingsModule} for capacity checks
 */
@Module({
  imports: [
    PrismaModule,
    SharedModule,
    DriverModule,
    VehicleModule,
    SubscriptionsModule,
  ],
  controllers: [
    TripTemplateController,
    TripInstanceController,
    PublicTripInstanceController,
  ],
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
    FindPublicTripInstancesUseCase,
    FindPublicTripInstancesByOrgSlugUseCase,
    FindPublicTripInstanceByIdUseCase,
    {
      provide: TripInstanceRepository,
      useClass: PrismaTripInstanceRepository,
    },
    {
      provide: PublicTripQueryService,
      useClass: PrismaPublicTripQueryService,
    },
  ],
  exports: [TripTemplateRepository, TripInstanceRepository],
})
export class TripModule {}
