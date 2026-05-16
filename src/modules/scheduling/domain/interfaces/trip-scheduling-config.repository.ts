import { TripSchedulingConfig } from '../entities/trip-scheduling-config.entity';

/**
 * Persistence contract for {@link TripSchedulingConfig}.
 *
 * Implementations must be transactional-aware (UnitOfWork-friendly) when
 * called from inside the registration flow, but reads do not require a
 * transaction.
 */
export abstract class TripSchedulingConfigRepository {
  abstract save(config: TripSchedulingConfig): Promise<TripSchedulingConfig>;
  abstract findByOrganizationId(
    organizationId: string,
  ): Promise<TripSchedulingConfig | null>;
  abstract update(
    config: TripSchedulingConfig,
  ): Promise<TripSchedulingConfig | null>;
}
