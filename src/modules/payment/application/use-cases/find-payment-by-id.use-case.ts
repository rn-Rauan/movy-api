import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';
import { PaymentNotFoundError } from '../../domain/errors/payment.errors';

/**
 * Retrieves a single payment by its UUID primary key.
 *
 * This use case is restricted to organisation administrators.
 */
@Injectable()
export class FindPaymentByIdUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  /**
   * Looks up the payment and throws if it does not exist.
   *
   * @param id - UUID of the payment to retrieve
   * @returns The matching {@link PaymentEntity}
   * @throws {@link PaymentNotFoundError} if no payment with the given `id` exists
   */
  async execute(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new PaymentNotFoundError(id);
    }
    return payment;
  }
}
