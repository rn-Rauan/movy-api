import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { TransactionManager } from './transaction-manager';
import { DbContext } from './db-context';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';
import { PrismaUnitOfWork } from './prisma-unit-of-work';

/**
 * `@Global()` NestJS module that provides database and transaction management
 * to every module in the application without requiring explicit imports.
 *
 * Exports:
 * - `PrismaService` — root client
 * - `DbContext` — transaction-aware client wrapper (uses `AsyncLocalStorage`)
 * - `UnitOfWork` → `PrismaUnitOfWork` — callback-based transaction abstraction
 * - `RoleRepository` — read-only role queries
 *
 * Legacy (deprecated in favor of `UnitOfWork` / `DbContext`):
 * - `TransactionManager` — delegates to `PrismaUnitOfWork`
 */
@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
    DbContext,
    {
      provide: UnitOfWork,
      useClass: PrismaUnitOfWork,
    },
    {
      provide: TransactionManager,
      useExisting: UnitOfWork,
    },
  ],
  exports: [
    PrismaService,
    RoleRepository,
    DbContext,
    UnitOfWork,
    TransactionManager,
  ],
})
export class PrismaModule {}
