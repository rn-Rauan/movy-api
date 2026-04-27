/**
 * Lifecycle states of a payment transaction.
 *
 * A payment is always created with `PENDING` status. It is later transitioned
 * to `COMPLETED` or `FAILED` according to the payment processing result.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
