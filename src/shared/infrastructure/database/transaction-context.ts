import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';

/**
 * Prisma transaction client — all model delegates but without top-level
 * methods that don't exist inside `$transaction` callbacks.
 */
export type PrismaTxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Holds the active Prisma transaction client for the current async context.
 *
 * Repositories call `client` to get the transaction-scoped client when one is
 * active, or `null` otherwise (falling back to the root `PrismaService`).
 */
@Injectable()
export class TransactionContext {
  private readonly storage = new AsyncLocalStorage<PrismaTxClient>();

  get client(): PrismaTxClient | null {
    return this.storage.getStore() ?? null;
  }

  run<T>(client: PrismaTxClient, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(client, fn);
  }
}
