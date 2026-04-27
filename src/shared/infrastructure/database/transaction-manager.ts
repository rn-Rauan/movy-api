/**
 * Application-layer abstraction for running a block of code inside a single
 * database transaction.
 *
 * The abstract class doubles as the NestJS injection token — concrete
 * implementations (e.g. `PrismaTransactionManager`) are bound to this token
 * inside the DI module.
 *
 * @example
 * ```ts
 * const result = await this.transactionManager.runInTransaction(async () => {
 *   const booking = await this.bookingRepository.save(bookingEntity);
 *   const payment = await this.paymentRepository.save(paymentEntity);
 *   return { booking, payment };
 * });
 * ```
 */
export abstract class TransactionManager {
  abstract runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
