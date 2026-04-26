import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';

@Injectable()
export class FindPaymentsByOrganizationUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(organizationId: string, options: PaginationOptions) {
    return this.paymentRepository.findAllByOrganizationId(
      organizationId,
      options,
    );
  }
}
