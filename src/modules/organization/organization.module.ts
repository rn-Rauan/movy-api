import { Module } from '@nestjs/common';
import { OrganizationController } from './presentation/controllers/organization.controller';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { PrismaOrganizationRepository } from './infrastructure/db/repositories/prisma-organization.repository';
import { OrganizationPresenter } from './presentation/mappers/organization.mapper';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';

@Module({
  controllers: [OrganizationController],
  providers: [
    CreateOrganizationUseCase,
    {
      provide: 'OrganizationRepository',
      useClass: PrismaOrganizationRepository,
    },
    OrganizationPresenter,
    PrismaService,
  ],
  exports: [CreateOrganizationUseCase, 'OrganizationRepository'],
})
export class OrganizationModule {}