import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { TripTemplateRepository } from './domain/interfaces';
import { PrismaTripTemplateRepository } from './infrastructure/db/repositories/prisma-trip-template.repository';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [],
  providers: [
    {
      provide: TripTemplateRepository,
      useClass: PrismaTripTemplateRepository,
    },
  ],
  exports: [TripTemplateRepository],
})
export class TripModule {}
