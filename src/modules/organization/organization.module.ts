import { Module } from '@nestjs/common';
import { OrganizationController } from './presentation/controllers/organization.controller';
import { PublicOrganizationController } from './presentation/controllers/public-organization.controller';
import {
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  FindAllOrganizationsUseCase,
  FindAllActiveOrganizationsUseCase,
  FindOrganizationByUserUseCase,
  FindOrganizationBySlugUseCase,
  UpdateOrganizationUseCase,
  DisableOrganizationUseCase,
} from './application/use-cases';
import { PrismaOrganizationRepository } from './infrastructure/db/repositories/prisma-organization.repository';
import { OrganizationRepository } from './domain/interfaces/organization.repository';
import { OrganizationPresenter } from './presentation/mappers/organization.mapper';
import { SharedModule } from 'src/shared';

/**
 * NestJS module managing the {@link Organization} aggregate.
 *
 * @remarks
 * Self-contained: only imports {@link SharedModule} (guards, decorators).
 * Exports all use cases and {@link OrganizationRepository} so that dependent
 * modules (e.g., `AuthModule`, `MembershipModule`, `BookingModule`) can resolve
 * organizations without importing the full module.
 *
 * {@link OrganizationPresenter} is provided as an injectable class instance
 * because it is injected into the controller via NestJS DI.
 */
@Module({
  imports: [SharedModule],
  controllers: [OrganizationController, PublicOrganizationController],
  providers: [
    CreateOrganizationUseCase,
    FindOrganizationByIdUseCase,
    FindAllOrganizationsUseCase,
    FindAllActiveOrganizationsUseCase,
    FindOrganizationByUserUseCase,
    FindOrganizationBySlugUseCase,
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
