import { Injectable } from '@nestjs/common';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
} from '../../domain/interfaces';

/**
 * Retrieves a single trip instance by its UUID, enriched with the parent
 * template (id, route points, stops, prices) and live booking occupancy.
 *
 * Combines the data the frontend would otherwise fetch in two requests
 * (`/trip-instances/:id` + `/trip-templates/:id`) into a single round-trip.
 *
 * Enforces organisation-scoped access: only members of the owning
 * organisation may read the instance.
 */
@Injectable()
export class FindTripInstanceByIdUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  async execute(
    id: string,
    organizationId?: string,
  ): Promise<TripInstanceWithMeta> {
    const data = await this.tripInstanceRepository.findByIdWithMeta(id);

    if (!data) {
      throw new TripInstanceNotFoundError(id);
    }

    if (organizationId && data.instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    return data;
  }
}
