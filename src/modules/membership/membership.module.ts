import { Module } from '@nestjs/common';
import { MembershipController } from './presentation/controllers/membership.controller';
import {
  CreateMembershipUseCase,
  FindMembershipByCompositeKeyUseCase,
  FindMembershipsByUserUseCase,
  FindMembershipsByOrganizationUseCase,
  RemoveMembershipUseCase,
  RestoreMembershipUseCase,
} from './application/use-cases';
import { PrismaMembershipRepository } from './infrastructure/db/repositories/prisma-membership.repository';
import { MembershipRepository } from './domain/interfaces/membership.repository';
import { MembershipPresenter } from './presentation/mappers/membership.presenter';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController],
  providers: [
    CreateMembershipUseCase,
    FindMembershipByCompositeKeyUseCase,
    FindMembershipsByUserUseCase,
    FindMembershipsByOrganizationUseCase,
    RemoveMembershipUseCase,
    RestoreMembershipUseCase,
    {
      provide: MembershipRepository,
      useClass: PrismaMembershipRepository,
    },
    MembershipPresenter,
  ],
  exports: [
    CreateMembershipUseCase,
    FindMembershipByCompositeKeyUseCase,
    FindMembershipsByUserUseCase,
    FindMembershipsByOrganizationUseCase,
    RemoveMembershipUseCase,
    RestoreMembershipUseCase,
    MembershipRepository,
  ],
})
export class MembershipModule {}
