import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { DriverModule } from 'src/modules/driver/driver.module';
import { VehicleModule } from 'src/modules/vehicle/vehicle.module';
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
import {
  TripInstanceRepository,
  TripTemplateRepository,
} from './domain/interfaces';
import { PrismaTripInstanceRepository } from './infrastructure/db/repositories/prisma-trip-instance.repository';
import { PrismaTripTemplateRepository } from './infrastructure/db/repositories/prisma-trip-template.repository';
import { TripInstanceController } from './presentation/controllers/trip-instance.controller';
import { TripTemplateController } from './presentation/controllers/trip-template.controller';

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
  imports: [PrismaModule, SharedModule, DriverModule, VehicleModule],
  controllers: [TripTemplateController, TripInstanceController],
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
