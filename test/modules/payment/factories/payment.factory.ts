import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';
import { PaymentStatus } from 'src/modules/payment/domain/interfaces/enums/payment-status.enum';
import { Money } from 'src/shared/domain/entities/value-objects';

type PaymentOverrides = Partial<{
  id: string;
  organizationId: string;
  enrollmentId: string;
  method: MethodPayment;
  amount: number;
  status: PaymentStatus;
  tripInstanceId: string;
  tripDepartureTime: Date;
}>;

export function makePayment(overrides: PaymentOverrides = {}): PaymentEntity {
  return PaymentEntity.restore({
    id: overrides.id ?? 'payment-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    enrollmentId: overrides.enrollmentId ?? 'enrollment-id-stub',
    method: overrides.method ?? MethodPayment.PIX,
    amount: Money.create(overrides.amount ?? 100),
    status: overrides.status ?? PaymentStatus.PENDING,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    tripInstanceId: overrides.tripInstanceId,
    tripDepartureTime: overrides.tripDepartureTime,
  });
}
