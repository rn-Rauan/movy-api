import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentResponseDto } from '../../application/dtos/payment-response.dto';

export class PaymentPresenter {
  static toHTTP(entity: PaymentEntity): PaymentResponseDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      enrollmentId: entity.enrollmentId,
      method: entity.method,
      amount: entity.amount.toNumber(),
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toHTTPList(entities: PaymentEntity[]): PaymentResponseDto[] {
    return entities.map(PaymentPresenter.toHTTP);
  }
}
