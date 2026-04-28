import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { PaymentMapper } from '../mappers/payment.mapper';

/**
 * Prisma-backed implementation of {@link PaymentRepository}.
 *
 * All I/O operations are performed via the Prisma Client targeting PostgreSQL.
 */
@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the transaction-scoped client when inside a transaction, or the root PrismaService. */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new payment row via `prisma.payment.create`.
   *
   * @param payment - The {@link PaymentEntity} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(payment: PaymentEntity): Promise<PaymentEntity | null> {
    const data = PaymentMapper.toPersistence(payment);
    const result = await this.db.payment.create({ data });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  /**
   * Finds a single payment by its UUID via `prisma.payment.findUnique`.
   *
   * @param id - The payment UUID
   * @returns The matching {@link PaymentEntity}, or `null` if not found
   */
  async findById(id: string): Promise<PaymentEntity | null> {
    const result = await this.db.payment.findUnique({ where: { id } });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  /**
   * Finds the payment linked to a specific enrollment via `prisma.payment.findUnique`.
   *
   * @param enrollmentId - The enrollment UUID
   * @returns The matching {@link PaymentEntity}, or `null` if not found
   */
  async findByEnrollmentId(
    enrollmentId: string,
  ): Promise<PaymentEntity | null> {
    const result = await this.db.payment.findUnique({
      where: { enrollmentId },
    });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  /**
   * Returns a paginated list of payments for an organisation, ordered by `createdAt` descending.
   *
   * @param organizationId - The organisation UUID
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} with the page of payment entities and pagination metadata
   */
  async findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PaymentEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.db.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.payment.count({ where: { organizationId } }),
    ]);

    return {
      data: payments.map((payment) => PaymentMapper.toDomain(payment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
