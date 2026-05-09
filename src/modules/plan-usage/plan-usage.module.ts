import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { VehicleModule } from 'src/modules/vehicle/vehicle.module';
import { DriverModule } from 'src/modules/driver/driver.module';
import { TripModule } from 'src/modules/trip/trip.module';
import { FindPlanUsageUseCase } from './application/use-cases';
import { PlanUsageController } from './presentation/controllers/plan-usage.controller';

/**
 * NestJS module exposing the cross-aggregate plan-usage read model.
 *
 * Composes counts from {@link VehicleModule}, {@link DriverModule}, and
 * {@link TripModule} together with the active subscription/plan resolved
 * via {@link SubscriptionsModule} and {@link PlansModule}.
 */
@Module({
  imports: [
    SharedModule,
    SubscriptionsModule,
    PlansModule,
    VehicleModule,
    DriverModule,
    TripModule,
  ],
  controllers: [PlanUsageController],
  providers: [FindPlanUsageUseCase],
})
export class PlanUsageModule {}
