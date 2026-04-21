import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';

@Injectable()
export class FindTripInstanceByIdUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Finds a trip instance by its unique ID, scoped to the requesting organization.
   * @param id - UUID of the trip instance
   * @param organizationId - UUID of the organization from JWT context
   * @returns TripInstance found
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceAccessForbiddenError if the instance belongs to a different organization
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
