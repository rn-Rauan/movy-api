import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';
import { DbContext } from './db-context';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction-manager';
import { Prisma } from 'generated/prisma/client';

/**
 * Prisma-backed implementation of {@link UnitOfWork}.
 *
 * Wraps a callback inside `PrismaService.$transaction`, stores the transaction
 * client in {@link DbContext} via `AsyncLocalStorage`, and executes the callback.
 *
 * Repositories that receive `DbContext` will automatically use the scoped client
 * for the duration of the callback without any changes to their method signatures.
 *
 * This class also implements the legacy {@link TransactionManager} interface
 * to support existing use cases during the transition.
 *
 * @example
 * ```ts
 * const result = await this.unitOfWork.execute(async () => {
 *   const booking = await this.bookingRepository.save(bookingEntity);
 *   const payment = await this.paymentRepository.save(paymentEntity);
 *   return { booking, payment };
 * });
 * ```
 */
@Injectable()
export class PrismaUnitOfWork implements UnitOfWork, TransactionManager {
  constructor(
    private readonly prisma: PrismaService,
    private readonly db: DbContext,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => this.db.run(tx, fn), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (attempt < maxAttempts && this.isRetryableTransactionError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Unreachable');
  }

  /** Legacy method for TransactionManager compatibility */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.execute(fn);
  }

  private isRetryableTransactionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    if (!('code' in error)) return false;
    return (error as { code?: unknown }).code === 'P2034';
  }
}
