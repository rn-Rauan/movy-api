import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';
import { TransitionTripInstanceStatusDto } from '../dtos';

@Injectable()
export class TransitionTripInstanceStatusUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Transitions a trip instance to a new lifecycle status.
   * All state machine rules and prerequisites (driver/vehicle for SCHEDULED+) are enforced
   * by the domain entity.
   * @param id - UUID of the trip instance
   * @param input - DTO containing the target status
   * @param organizationId - UUID of the organization from JWT context
   * @returns TripInstance with updated status
   * @throws TripInstanceNotFoundError if the trip instance does not exist
   * @throws TripInstanceAccessForbiddenError if the instance belongs to a different organization
   * @throws InvalidTripStatusTransitionError if the transition is not allowed by the state machine
   * @throws TripInstanceRequiredFieldError if driver or vehicle is missing for SCHEDULED/CONFIRMED/IN_PROGRESS
   */
  async execute(
    id: string,
    input: TransitionTripInstanceStatusDto,
    organizationId: string,
  ): Promise<TripInstance> {
    const instance = await this.tripInstanceRepository.findById(id);

    if (!instance) {
      throw new TripInstanceNotFoundError(id);
    }

    if (instance.organizationId !== organizationId) {
      throw new TripInstanceAccessForbiddenError(id);
    }

    instance.transitionTo(input.newStatus);

    const updated = await this.tripInstanceRepository.update(instance);

    if (!updated) {
      throw new TripInstanceNotFoundError(id);
    }

    return updated;
  }
}
