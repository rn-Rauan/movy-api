import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';

/**
 * `@Global()` NestJS module that provides `PrismaService` and `RoleRepository`
 * to every module in the application without requiring explicit imports.
 *
 * Binds `RoleRepository` (abstract) → `PrismaRoleRepository` (Prisma impl).
 */
@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
  ],
  exports: [PrismaService, RoleRepository],
})
export class PrismaModule {}
