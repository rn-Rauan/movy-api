import { Module, forwardRef } from '@nestjs/common';
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
import { FindRoleByUserIdAndOrganizationIdUseCase } from './application/use-cases/find-role-by-user-and-organization.use-case';
import { SharedModule } from 'src/shared';
import { UserModule } from '../user/user.module';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [SharedModule, forwardRef(() => UserModule), DriverModule],
  controllers: [MembershipController],
  providers: [
    CreateMembershipUseCase,
    FindMembershipByCompositeKeyUseCase,
    FindMembershipsByUserUseCase,
    FindMembershipsByOrganizationUseCase,
    RemoveMembershipUseCase,
    RestoreMembershipUseCase,
    FindRoleByUserIdAndOrganizationIdUseCase,
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
    FindRoleByUserIdAndOrganizationIdUseCase,
  ],
})
export class MembershipModule {}
