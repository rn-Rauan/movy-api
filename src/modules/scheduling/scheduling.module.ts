import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import {
  FindTripSchedulingConfigUseCase,
  UpdateTripSchedulingConfigUseCase,
} from './application/use-cases';
import { TripSchedulingConfigRepository } from './domain/interfaces';
import { PrismaTripSchedulingConfigRepository } from './infrastructure/db/repositories/prisma-trip-scheduling-config.repository';
import { TripSchedulingConfigController } from './presentation/controllers/trip-scheduling-config.controller';

/**
 * Per-organisation scheduling configuration: `daysAhead` window and the cron
 * expressions used by the trip generation and auto-cancel jobs.
 *
 * Exports {@link TripSchedulingConfigRepository} so other modules (auth signup
 * for auto-create, future cron services) can read/write the config without
 * coupling to the Prisma implementation.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TripSchedulingConfigController],
  providers: [
    FindTripSchedulingConfigUseCase,
    UpdateTripSchedulingConfigUseCase,
    {
      provide: TripSchedulingConfigRepository,
      useClass: PrismaTripSchedulingConfigRepository,
    },
  ],
  exports: [TripSchedulingConfigRepository],
})
export class SchedulingModule {}
