import { Module } from '@nestjs/common';
import { OrganizationController } from './presentation/controllers/organization.controller';
import {
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindAllOrganizationsUseCase,
  FindAllActiveOrganizationsUseCase,
  FindOrganizationByUserUseCase,
  UpdateOrganizationUseCase,
  DisableOrganizationUseCase,
} from './application/use-cases';
import { PrismaOrganizationRepository } from './infrastructure/db/repositories/prisma-organization.repository';
import { OrganizationRepository } from './domain/interfaces/organization.repository';
import { OrganizationPresenter } from './presentation/mappers/organization.mapper';
import { SharedModule } from 'src/shared';

@Module({
  imports: [SharedModule],
  controllers: [OrganizationController],
  providers: [
    CreateOrganizationUseCase,
    FindOrganizationByIdUseCase,
    FindAllOrganizationsUseCase,
    FindAllActiveOrganizationsUseCase,
    FindOrganizationByUserUseCase,
    UpdateOrganizationUseCase,
    DisableOrganizationUseCase,
    {
      provide: OrganizationRepository,
      useClass: PrismaOrganizationRepository,
    },
    OrganizationPresenter,
  ],
  exports: [
    CreateOrganizationUseCase,
    FindOrganizationByIdUseCase,
    FindAllOrganizationsUseCase,
    FindAllActiveOrganizationsUseCase,
    FindOrganizationByUserUseCase,
    UpdateOrganizationUseCase,
    DisableOrganizationUseCase,
    OrganizationRepository,
  ],
})
export class OrganizationModule {}
