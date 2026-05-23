import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { DriverModule } from 'src/modules/driver/driver.module';
import { VehicleModule } from 'src/modules/vehicle/vehicle.module';
import { OrganizationModule } from 'src/modules/organization/organization.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { SchedulingModule } from 'src/modules/scheduling/scheduling.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import {
  CreateTripTemplateUseCase,
  UpdateTripTemplateUseCase,
  FindTripTemplateByIdUseCase,
  FindAllTripTemplatesByOrganizationUseCase,
  DeactivateTripTemplateUseCase,
  CreateTripInstanceUseCase,
  FindTripInstanceByIdUseCase,
  FindAllTripInstancesByOrganizationUseCase,
  FindTripInstancesByDriverMeUseCase,
  FindTripInstancesByTemplateUseCase,
  TransitionTripInstanceStatusUseCase,
  AssignDriverToTripInstanceUseCase,
  AssignVehicleToTripInstanceUseCase,
  FindPublicTripInstancesUseCase,
  FindPublicTripInstancesByOrgSlugUseCase,
  FindPublicTripInstanceByIdUseCase,
  CancelExpiredTripInstancesUseCase,
  GenerateRecurringTripInstancesUseCase,
  GenerateTripInstancesForTemplateUseCase,
} from './application/use-cases';
import { AutoCancelTripInstancesCron } from './infrastructure/cron/auto-cancel-trip-instances.cron';
import { GenerateRecurringTripInstancesCron } from './infrastructure/cron/generate-recurring-trip-instances.cron';
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
    OrganizationModule,
    SubscriptionsModule,
    SchedulingModule,
    PaymentModule,
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
    FindTripInstancesByDriverMeUseCase,
    FindTripInstancesByTemplateUseCase,
    TransitionTripInstanceStatusUseCase,
    AssignDriverToTripInstanceUseCase,
    AssignVehicleToTripInstanceUseCase,
    FindPublicTripInstancesUseCase,
    FindPublicTripInstancesByOrgSlugUseCase,
    FindPublicTripInstanceByIdUseCase,
    // Scheduled jobs + admin-triggered generation
    CancelExpiredTripInstancesUseCase,
    AutoCancelTripInstancesCron,
    GenerateRecurringTripInstancesUseCase,
    GenerateRecurringTripInstancesCron,
    GenerateTripInstancesForTemplateUseCase,
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
