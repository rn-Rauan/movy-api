import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PaymentEntity } from '../entities/payment.entity';

export abstract class PaymentRepository {
  abstract save(payment: PaymentEntity): Promise<PaymentEntity | null>;
  abstract findById(id: string): Promise<PaymentEntity | null>;
  abstract findByEnrollmentId(
    enrollmentId: string,
  ): Promise<PaymentEntity | null>;
  abstract findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PaymentEntity>>;
}
