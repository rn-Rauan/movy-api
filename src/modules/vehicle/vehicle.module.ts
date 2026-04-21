import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { VehicleController } from './presentation/controllers/vehicle.controller';
import {
  CreateVehicleUseCase,
  FindAllVehiclesByOrganizationUseCase,
  FindVehicleByIdUseCase,
  RemoveVehicleUseCase,
  UpdateVehicleUseCase,
} from './application/use-cases';
import { VehicleRepository } from './domain/interfaces';
import { PrismaVehicleRepository } from './infrastructure/db/repositories/prisma-vehicle.repository';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [VehicleController],
  providers: [
    CreateVehicleUseCase,
    UpdateVehicleUseCase,
    FindVehicleByIdUseCase,
    FindAllVehiclesByOrganizationUseCase,
    RemoveVehicleUseCase,
    {
      provide: VehicleRepository,
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: [VehicleRepository],
})
export class VehicleModule {}
