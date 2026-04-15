import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import {
  CreateDriverUseCase,
  FindDriverByIdUseCase,
  FindDriverByUserIdUseCase,
  UpdateDriverUseCase,
  RemoveDriverUseCase,
  FindAllDriversByOrganizationUseCase,
  LookupDriverUseCase,
} from './application/use-cases';
import { PrismaDriverRepository } from './infrastructure/db/repositories/prisma-driver.repository';
import { DriverRepository } from './domain/interfaces';
import { DriverController } from './presentation/controllers/driver.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, SharedModule, UserModule],
  controllers: [DriverController],
  providers: [
    CreateDriverUseCase,
    FindDriverByIdUseCase,
    FindDriverByUserIdUseCase,
    UpdateDriverUseCase,
    RemoveDriverUseCase,
    FindAllDriversByOrganizationUseCase,
    LookupDriverUseCase,
    {
      provide: DriverRepository,
      useClass: PrismaDriverRepository,
    },
  ],
  exports: [
    CreateDriverUseCase,
    FindDriverByIdUseCase,
    FindDriverByUserIdUseCase,
    UpdateDriverUseCase,
    RemoveDriverUseCase,
    FindAllDriversByOrganizationUseCase,
    LookupDriverUseCase,
    DriverRepository,
  ],
})
export class DriverModule {}
