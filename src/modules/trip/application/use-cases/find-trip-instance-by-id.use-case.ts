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

  /**
   * Looks up the instance and validates org ownership.
   *
   * @param id - UUID of the trip instance
   * @param organizationId - UUID of the organisation (from JWT)
   * @returns The matching {@link TripInstance}
   * @throws {@link TripInstanceNotFoundError} if the instance does not exist
   * @throws {@link TripInstanceAccessForbiddenError} if the instance belongs to a different org
   */
  async execute(id: string, organizationId: string): Promise<TripInstance> {
    const instance = await this.tripInstanceRepository.findById(id);

    if (!instance) {
      throw new TripInstanceNotFoundError(id);
    }

    if (instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    return instance;
  }
}
