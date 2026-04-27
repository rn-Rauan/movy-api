import type { Payment as PrismaPayment } from 'generated/prisma/client';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { PaymentStatus } from 'src/modules/payment/domain/interfaces/enums/payment-status.enum';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';

/**
 * Bidirectional mapper between the Prisma `Payment` model and the {@link PaymentEntity} domain object.
 *
 * Contains no business logic — only field-level translations between persistence
 * and domain representations.
 */
export class PaymentMapper {
  /**
   * Converts a raw Prisma `Payment` record to a {@link PaymentEntity} domain object.
   *
   * Casts `amount` from `Prisma.Decimal` to `number` via `Number()` and
   * reconstructs the {@link Money} Value Object from that value.
   *
   * @param raw - Raw `Payment` record returned by the Prisma client
   * @returns A fully hydrated {@link PaymentEntity} instance
   */
  static toDomain(raw: PrismaPayment): PaymentEntity {
    return PaymentEntity.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      enrollmentId: raw.enrollmentId,
      method: raw.method as MethodPayment,
      amount: Money.restore(Number(raw.amount)),
      status: raw.status as PaymentStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link PaymentEntity} to the plain object expected by Prisma's `create` method.
   *
   * The return type is intentionally left untyped to avoid an explicit `Prisma.Decimal` cast;
   * passing a plain `number` to `amount` is accepted by the Prisma client at runtime.
   *
   * @param entity - The {@link PaymentEntity} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.payment.create({ data })`
   */
  static toPersistence(entity: PaymentEntity) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      enrollmentId: entity.enrollmentId,
      method: entity.method,
      amount: entity.amount.toNumber(),
      status: entity.status,
    };
  }
}
