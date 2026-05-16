import { Injectable } from '@nestjs/common';
import { TripSchedulingConfig } from '../../domain/entities/trip-scheduling-config.entity';
import { TripSchedulingConfigNotFoundError } from '../../domain/entities/errors/trip-scheduling-config.errors';
import { TripSchedulingConfigRepository } from '../../domain/interfaces/trip-scheduling-config.repository';

/**
 * Returns the scheduling configuration for an organisation.
 *
 * @throws {@link TripSchedulingConfigNotFoundError} if no row exists for the org.
 */
@Injectable()
export class FindTripSchedulingConfigUseCase {
  constructor(private readonly repository: TripSchedulingConfigRepository) {}

  async execute(organizationId: string): Promise<TripSchedulingConfig> {
    const config = await this.repository.findByOrganizationId(organizationId);
    if (!config) {
      throw new TripSchedulingConfigNotFoundError(organizationId);
    }
    return config;
  }
}
