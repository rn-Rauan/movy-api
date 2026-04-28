import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaService } from './prisma.service';

export type PrismaTxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Holds the active Prisma client for the current async context.
 *
 * - During a transaction: `getClient()` returns the transaction-scoped client
 * - Outside a transaction: `getClient()` returns the root `PrismaService`
 *
 * Repositories call `getClient()` to get the correct client without knowing
 * whether a transaction is active — making them transaction-aware transparently.
 *
 * Uses `AsyncLocalStorage` for concurrency safety (unlike a naive singleton).
 */
@Injectable()
export class DbContext {
  private readonly storage = new AsyncLocalStorage<PrismaTxClient>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the active Prisma client.
   * - During a transaction: returns the transaction-scoped client
   * - Outside a transaction: returns the root PrismaService
   */
  get client(): PrismaService | PrismaTxClient {
    return this.storage.getStore() ?? this.prisma;
  }

  /**
   * Returns the transaction-scoped client if one is active, or null otherwise.
   */
  get transactionClient(): PrismaTxClient | null {
    return this.storage.getStore() ?? null;
  }

  run<T>(client: PrismaTxClient, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(client, fn);
  }
}
