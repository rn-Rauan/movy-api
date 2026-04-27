import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { TransactionContext } from './transaction-context';
import { TransactionManager } from './transaction-manager';
import { PrismaTransactionManager } from './prisma-transaction-manager';

/**
 * `@Global()` NestJS module that provides `PrismaService` and `RoleRepository`
 * to every module in the application without requiring explicit imports.
 *
 * Also provides and exports:
 * - `TransactionContext` — `AsyncLocalStorage` holder for the active Prisma tx client
 * - `TransactionManager` → `PrismaTransactionManager` — wraps use-case callbacks in `$transaction`
 */
@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
    TransactionContext,
    {
      provide: TransactionManager,
      useClass: PrismaTransactionManager,
    },
  ],
  exports: [PrismaService, RoleRepository, TransactionContext, TransactionManager],
})
export class PrismaModule {}
