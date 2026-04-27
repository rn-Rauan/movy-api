import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository } from '../../domain/interfaces';
import { TransitionTripInstanceStatusDto } from '../dtos';

/**
 * Transitions a {@link TripInstance} to a new lifecycle status.
 *
 * All state machine rules and prerequisite checks (driver/vehicle required for
 * `SCHEDULED` and beyond) are delegated to {@link TripInstance.transitionTo}.
 * Only org administrators may call this endpoint.
 */
@Injectable()
export class TransitionTripInstanceStatusUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Validates org ownership, applies the status transition, and persists.
   *
   * @param id - UUID of the trip instance
   * @param input - DTO containing the target status
   * @param organizationId - UUID of the organisation (from JWT)
   * @returns The updated {@link TripInstance}
   * @throws {@link TripInstanceNotFoundError} if the instance does not exist
   * @throws {@link TripInstanceAccessForbiddenError} if the instance belongs to a different org
   * @throws {@link InvalidTripStatusTransitionError} if the transition is not allowed
   * @throws {@link TripInstanceRequiredFieldError} if driver or vehicle is missing when required
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
