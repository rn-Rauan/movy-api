import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';

/**
 * Retrieves a single {@link TripInstance} by its UUID.
 *
 * Enforces organisation-scoped access: only members of the owning
 * organisation may read the instance.
 */
@Injectable()
export class FindTripInstanceByIdUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  async execute(id: string, organizationId?: string): Promise<TripInstance> {
    const instance = await this.tripInstanceRepository.findById(id);

    if (!instance) {
      throw new TripInstanceNotFoundError(id);
    }

    if (organizationId && instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    return instance;
  }
}
