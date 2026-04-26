import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionResponseDto } from '../../application/dtos/subscription-response.dto';

export class SubscriptionPresenter {
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

  static toHTTPList(entities: SubscriptionEntity[]): SubscriptionResponseDto[] {
    return entities.map((entity) => SubscriptionPresenter.toHTTP(entity));
  }
}
