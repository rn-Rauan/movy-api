import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';
import { PaymentStatus } from '../../domain/interfaces/enums/payment-status.enum';
import {
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
} from '../../domain/errors/payment.errors';
import { PaymentEntity } from '../../domain/entities/payment.entity';

/**
 * Simulates payment confirmation by transitioning a PENDING payment to COMPLETED.
 *
 * This is a simulated flow — no external payment gateway is involved.
 * Guard: only PENDING payments may be confirmed; already-processed ones are rejected.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  /**
   * Confirms a payment.
   *
   * @param id - UUID of the payment to confirm
   * @param organizationId - Requesting organisation; validates tenant ownership
   * @returns The updated {@link PaymentEntity} with status COMPLETED
   * @throws PaymentNotFoundError if no payment matches the id
   * @throws PaymentAlreadyProcessedError if the payment is not PENDING
   */
  async execute(id: string, organizationId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment || payment.organizationId !== organizationId) {
      throw new PaymentNotFoundError(id);
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new PaymentAlreadyProcessedError(id);
    }
    payment.confirm();
    const updated = await this.paymentRepository.update(payment);
    return updated ?? payment;
  }
}
