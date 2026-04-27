import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PaymentEntity } from '../entities/payment.entity';

/**
 * Repository contract for {@link PaymentEntity}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-payment.repository.ts`.
 * This abstract class is registered in the NestJS DI container as a token so that
 * use cases depend only on the interface, not on the Prisma client.
 */
export abstract class PaymentRepository {
  /**
   * Persists a new payment record in the database.
   *
   * @param payment - The {@link PaymentEntity} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(payment: PaymentEntity): Promise<PaymentEntity | null>;

  /**
   * Finds a payment by its UUID primary key.
   *
   * @param id - The payment UUID
   * @returns The matching {@link PaymentEntity}, or `null` if not found
   */
  abstract findById(id: string): Promise<PaymentEntity | null>;

  /**
   * Finds the payment associated with a specific enrollment (booking).
   *
   * @param enrollmentId - The enrollment UUID
   * @returns The matching {@link PaymentEntity}, or `null` if not found
   */
  abstract findByEnrollmentId(
    enrollmentId: string,
  ): Promise<PaymentEntity | null>;

  /**
   * Returns a paginated list of all payments within a given organisation,
   * ordered by `createdAt` descending.
   *
   * @param organizationId - The organisation UUID
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link PaymentEntity} items
   */
  abstract findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PaymentEntity>>;
}
