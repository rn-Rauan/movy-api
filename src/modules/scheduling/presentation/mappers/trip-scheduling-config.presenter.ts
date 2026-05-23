import { TripSchedulingConfig } from '../../domain/entities/trip-scheduling-config.entity';
import { TripSchedulingConfigResponseDto } from '../../application/dtos/trip-scheduling-config-response.dto';

/**
 * Serialises {@link TripSchedulingConfig} into the HTTP response DTO.
 */
export class TripSchedulingConfigPresenter {
  static toHTTP(entity: TripSchedulingConfig): TripSchedulingConfigResponseDto {
    return new TripSchedulingConfigResponseDto({
      id: entity.id,
      organizationId: entity.organizationId,
      daysAhead: entity.daysAhead,
      enabled: entity.enabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
