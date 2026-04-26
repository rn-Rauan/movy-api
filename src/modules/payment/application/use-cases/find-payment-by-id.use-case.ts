import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';
import { PaymentNotFoundError } from '../../domain/errors/payment.errors';

@Injectable()
export class FindPaymentByIdUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new PaymentNotFoundError(id);
    }
    return payment;
  }
}
