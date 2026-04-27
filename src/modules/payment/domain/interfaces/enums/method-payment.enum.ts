/**
 * Payment methods accepted when recording a booking payment.
 *
 * The value is persisted as a string column in the `Payment` table.
 */
export enum MethodPayment {
  MONEY = 'MONEY',
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}
