import { Money } from 'src/shared/domain/entities/value-objects';
import { MethodPayment } from '../interfaces/enums/method-payment.enum';
import { PaymentStatus } from '../interfaces/enums/payment-status.enum';

interface PaymentState {
  readonly id: string;
  readonly organizationId: string;
  readonly enrollmentId: string;
  readonly method: MethodPayment;
  amount: Money;
  status: PaymentStatus;
  readonly createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentProps {
  organizationId: string;
  enrollmentId: string;
  method: MethodPayment;
  amount: Money;
}

export class PaymentEntity {
  private readonly props: PaymentState;

  private constructor(props: PaymentState) {
    this.props = props;
  }

  static create(props: CreatePaymentProps): PaymentEntity {
    const now = new Date();
    return new PaymentEntity({
      id: crypto.randomUUID(),
      organizationId: props.organizationId,
      enrollmentId: props.enrollmentId,
      method: props.method,
      amount: props.amount,
      status: PaymentStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: PaymentState): PaymentEntity {
    return new PaymentEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get enrollmentId(): string {
    return this.props.enrollmentId;
  }
  get method(): MethodPayment {
    return this.props.method;
  }
  get amount(): Money {
    return this.props.amount;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
