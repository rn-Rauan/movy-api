import { Injectable } from '@nestjs/common';
import { TransactionManager } from './transaction-manager';
import { TransactionContext } from './transaction-context';
import { PrismaService } from './prisma.service';

/**
 * Prisma-backed implementation of {@link TransactionManager}.
 *
 * Wraps a function inside `PrismaService.$transaction`, stores the transaction
 * client in {@link TransactionContext} via `AsyncLocalStorage`, and then
 * executes the provided function. Repositories that receive `TransactionContext`
 * will automatically use the scoped client for the duration of the callback
 * without any changes to their method signatures.
 */
@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: TransactionContext,
  ) {}

  runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => this.context.run(tx, fn));
  }
}
