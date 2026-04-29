import { Money } from 'src/shared/domain/entities/value-objects';
import { MethodPayment } from '../interfaces/enums/method-payment.enum';
import { PaymentStatus } from '../interfaces/enums/payment-status.enum';

/** @internal Internal state bag of a payment entity. Fields without `readonly` can be mutated. */
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

/**
 * Properties required to create a new {@link PaymentEntity}.
 * All fields are mandatory and validated at the use-case boundary.
 */
export interface CreatePaymentProps {
  organizationId: string;
  enrollmentId: string;
  method: MethodPayment;
  amount: Money;
}

/**
 * Domain aggregate root representing a payment transaction.
 *
 * A payment is always created with `status = PENDING` and an RFC 4122 UUID
 * generated via `crypto.randomUUID()` in the domain layer. The `id` is
 * therefore available before any database interaction.
 *
 * @see PaymentStatus
 * @see MethodPayment
 * @see CreatePaymentProps
 */
export class PaymentEntity {
  private readonly props: PaymentState;

  private constructor(props: PaymentState) {
    this.props = props;
  }

  /**
   * Creates a new payment with `status = PENDING`, a UUID from `crypto.randomUUID()`,
   * and both timestamps set to **now**.
   *
   * @param props - Validated data for the payment (organization, enrollment, method, amount)
   * @returns A new {@link PaymentEntity} ready to be persisted
   */
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

  /**
   * Reconstructs a payment entity from a persisted database record.
   *
   * Intended for **exclusive** use by the infrastructure mapper.
   * Do not call this method from application or domain code.
   *
   * @param props - Complete state as returned by the database
   * @returns A {@link PaymentEntity} instance that mirrors the stored state
   */
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

  /** Marks the payment as completed. Use-case must guard against double-processing. */
  confirm(): void {
    this.props.status = PaymentStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  /** Marks the payment as failed. Use-case must guard against double-processing. */
  fail(): void {
    this.props.status = PaymentStatus.FAILED;
    this.props.updatedAt = new Date();
  }
}
