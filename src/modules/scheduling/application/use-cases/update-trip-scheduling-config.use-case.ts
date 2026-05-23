import { Injectable } from '@nestjs/common';
import { TripSchedulingConfig } from '../../domain/entities/trip-scheduling-config.entity';
import { TripSchedulingConfigNotFoundError } from '../../domain/entities/errors/trip-scheduling-config.errors';
import { TripSchedulingConfigRepository } from '../../domain/interfaces/trip-scheduling-config.repository';
import { UpdateTripSchedulingConfigDto } from '../dtos/update-trip-scheduling-config.dto';

/**
 * Applies a partial update to an organisation's {@link TripSchedulingConfig}.
 *
 * Each provided field is validated by the entity before persistence.
 *
 * @throws {@link TripSchedulingConfigNotFoundError} when no row exists for the org.
 * @throws {@link InvalidSchedulingDaysAheadError} when `daysAhead` is out of bounds.
 */
@Injectable()
export class UpdateTripSchedulingConfigUseCase {
  constructor(private readonly repository: TripSchedulingConfigRepository) {}

  async execute(
    organizationId: string,
    input: UpdateTripSchedulingConfigDto,
  ): Promise<TripSchedulingConfig> {
    const config = await this.repository.findByOrganizationId(organizationId);
    if (!config) {
      throw new TripSchedulingConfigNotFoundError(organizationId);
    }

    if (input.daysAhead !== undefined) {
      config.updateDaysAhead(input.daysAhead);
    }

    if (input.enabled !== undefined) {
      config.setEnabled(input.enabled);
    }

    const updated = await this.repository.update(config);
    if (!updated) {
      throw new TripSchedulingConfigNotFoundError(organizationId);
    }
    return updated;
  }
}
