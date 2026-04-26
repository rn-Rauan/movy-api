import type { Payment as PrismaPayment } from 'generated/prisma/client';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { PaymentStatus } from 'src/modules/payment/domain/interfaces/enums/payment-status.enum';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';

export class PaymentMapper {
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
