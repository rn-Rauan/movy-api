import { TripSchedulingConfig as PrismaTripSchedulingConfig } from 'generated/prisma/client';
import { TripSchedulingConfig } from '../../../domain/entities/trip-scheduling-config.entity';

/**
 * Bidirectional mapper between the Prisma `TripSchedulingConfig` row and the
 * {@link TripSchedulingConfig} domain object. Contains no business logic.
 */
export class TripSchedulingConfigMapper {
  static toDomain(raw: PrismaTripSchedulingConfig): TripSchedulingConfig {
    return TripSchedulingConfig.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      daysAhead: raw.daysAhead,
      enabled: raw.enabled,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: TripSchedulingConfig) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      daysAhead: entity.daysAhead,
      enabled: entity.enabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
