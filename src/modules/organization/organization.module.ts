import { Module, forwardRef } from '@nestjs/common';
import { OrganizationController } from './presentation/controllers/organization.controller';
import {
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindAllOrganizationsUseCase,
  FindAllActiveOrganizationsUseCase,
  UpdateOrganizationUseCase,
  DisableOrganizationUseCase,
} from './application/use-cases';
import { PrismaOrganizationRepository } from './infrastructure/db/repositories/prisma-organization.repository';
import { OrganizationRepository } from './domain/interfaces/organization.repository';
import { OrganizationPresenter } from './presentation/mappers/organization.mapper';
import { SharedModule } from 'src/shared';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [SharedModule, forwardRef(() => MembershipModule)],
  controllers: [OrganizationController],
  providers: [
    CreateOrganizationUseCase,
    FindOrganizationByIdUseCase,
    FindAllOrganizationsUseCase,
    FindAllActiveOrganizationsUseCase,
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
    UpdateOrganizationUseCase,
    DisableOrganizationUseCase,
    OrganizationRepository,
  ],
})
export class OrganizationModule {}
