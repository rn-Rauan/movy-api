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
import { UserOrganizationRoleResolver } from 'src/shared/domain/interfaces/user-organization-role.resolver';
import { MembershipUserOrgRoleResolver } from './infrastructure/providers/membership-user-org-role.resolver';
import { UserModule } from '../user/user.module';

@Module({
  imports: [SharedModule, forwardRef(() => UserModule)],
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
    {
      provide: UserOrganizationRoleResolver,
      useClass: MembershipUserOrgRoleResolver,
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
    UserOrganizationRoleResolver,
  ],
})
export class MembershipModule {}
