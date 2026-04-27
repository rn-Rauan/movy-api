import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionResponseDto } from '../../application/dtos/subscription-response.dto';

/**
 * Serialises a {@link SubscriptionEntity} domain object into the HTTP response shape
 * {@link SubscriptionResponseDto}.
 *
 * Should be called exclusively from controller methods, never from use cases.
 */
export class SubscriptionPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param entity - The {@link SubscriptionEntity} to serialise
   * @returns A {@link SubscriptionResponseDto} safe to include in an HTTP response
   */
  static toHTTP(entity: SubscriptionEntity): SubscriptionResponseDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      planId: entity.planId,
      status: entity.status,
      startDate: entity.startDate,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link SubscriptionEntity} instances to serialise
   * @returns Array of {@link SubscriptionResponseDto} objects
   */
  static toHTTPList(entities: SubscriptionEntity[]): SubscriptionResponseDto[] {
    return entities.map((entity) => SubscriptionPresenter.toHTTP(entity));
  }
}
