import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentResponseDto } from '../../application/dtos/payment-response.dto';

/**
 * Serialises a {@link PaymentEntity} domain object into the HTTP response shape {@link PaymentResponseDto}.
 *
 * Responsible for unwrapping the {@link Money} Value Object into a plain `number`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class PaymentPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param entity - The {@link PaymentEntity} to serialise
   * @returns A {@link PaymentResponseDto} safe to include in an HTTP response
   */
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

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link PaymentEntity} instances to serialise
   * @returns Array of {@link PaymentResponseDto} objects
   */
  static toHTTPList(entities: PaymentEntity[]): PaymentResponseDto[] {
    return entities.map((entity) => PaymentPresenter.toHTTP(entity));
  }
}
