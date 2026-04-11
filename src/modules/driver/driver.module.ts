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
} from './application/use-cases';
import { PrismaDriverRepository } from './infrastructure/db/repositories/prisma-driver.repository';
import { DriverRepository } from './domain/interfaces';
import { DriverController } from './presentation/controllers/driver.controller';
import { DriverPresenter } from './presentation/mappers/driver.presenter';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [DriverController],
  providers: [
    // Presenter
    DriverPresenter,
    
    // Use Cases
    CreateDriverUseCase,
    FindDriverByIdUseCase,
    FindDriverByUserIdUseCase,
    UpdateDriverUseCase,
    RemoveDriverUseCase,
    FindAllDriversByOrganizationUseCase,
    
    // Repository
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
    DriverRepository,
  ],
})
export class DriverModule {}
