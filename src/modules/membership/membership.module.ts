import { Module, forwardRef } from '@nestjs/common';
import { MembershipController } from './presentation/controllers/membership.controller';
import {
  AssociateDriverToOrganizationUseCase,
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
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

/**
 * NestJS module managing the {@link Membership} aggregate.
 *
 * @remarks
 * Imports {@link SharedModule} (guards, decorators), `UserModule` (via `forwardRef`
 * to avoid circular dependencies), and `DriverModule` (for driver profile validation).
 *
 * {@link MembershipPresenter} is provided as an injectable instance injected into the controller.
 *
 * Exports all use cases + `MembershipRepository` token so that other modules
 * (e.g., `AuthModule`) can resolve memberships without importing the full module.
 */
@Module({
  imports: [
    SharedModule,
    forwardRef(() => UserModule),
    DriverModule,
    SubscriptionsModule,
  ],
  controllers: [MembershipController],
  providers: [
    AssociateDriverToOrganizationUseCase,
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
    AssociateDriverToOrganizationUseCase,
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
