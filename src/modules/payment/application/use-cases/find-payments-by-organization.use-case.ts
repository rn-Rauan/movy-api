import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { PaymentRepository } from '../../domain/interfaces/payment.repository';

/**
 * Returns a paginated list of all payments belonging to a given organisation.
 *
 * This use case is restricted to organisation administrators.
 */
@Injectable()
export class FindPaymentsByOrganizationUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  /**
   * Delegates to the repository for a paginated result, ordered by `createdAt` descending.
   *
   * @param organizationId - UUID of the organisation whose payments to list
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} containing the requested page of {@link PaymentEntity} items
   */
  async execute(organizationId: string, options: PaginationOptions) {
    return this.paymentRepository.findAllByOrganizationId(
      organizationId,
      options,
    );
  }
}
