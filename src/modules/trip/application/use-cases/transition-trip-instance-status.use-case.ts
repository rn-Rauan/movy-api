import { Injectable } from '@nestjs/common';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';
import { RoleName } from 'src/shared/domain/types';
import { TripInstance } from '../../domain/entities';
import {
  DriverTripStatusTransitionForbiddenError,
  TripInstanceAccessForbiddenError,
  TripInstanceNotFoundError,
  TripNotAssignedToDriverError,
} from '../../domain/entities/errors/trip-instance.errors';
import { TripInstanceRepository, TripStatus } from '../../domain/interfaces';
import { TransitionTripInstanceStatusDto } from '../dtos';

/**
 * Calling context for the status transition. Mirrors {@link PaymentActorContext}.
 *
 * When `role` is `DRIVER`, the use case enforces an ownership check: only the
 * driver assigned to the trip may change its status, and only to `IN_PROGRESS`
 * or `FINISHED`. When `role` is `ADMIN` (or omitted, e.g. cron / internal),
 * the full state-machine remains accessible.
 */
export interface TripStatusActorContext {
  userId: string;
  role?: 'ADMIN' | 'DRIVER' | null;
}

const DRIVER_ALLOWED_TARGETS: readonly TripStatus[] = [
  TripStatus.IN_PROGRESS,
  TripStatus.FINISHED,
];

/**
 * Transitions a {@link TripInstance} to a new lifecycle status.
 *
 * @remarks
 * - The state-machine validation lives on {@link TripInstance.transitionTo} —
 *   this use case adds the authorization layer on top.
 * - ADMIN callers retain the full set of transitions.
 * - DRIVER callers may only transition trips they are assigned to, and only
 *   to `IN_PROGRESS` (boarding) or `FINISHED` (arrival). All other targets
 *   (CANCELLED, back to SCHEDULED, etc.) remain admin-only.
 */
@Injectable()
export class TransitionTripInstanceStatusUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly driverRepository: DriverRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  /**
   * @param id - UUID of the trip instance
   * @param input - DTO containing the target status
   * @param organizationId - UUID of the organisation (from JWT)
   * @param actorContext - Optional acting user + role. When omitted, behaves
   *   as the legacy ADMIN flow (backwards compatible with internal callers).
   * @returns The updated {@link TripInstance}
   * @throws {@link TripInstanceNotFoundError} if the instance does not exist
   * @throws {@link TripInstanceAccessForbiddenError} if the instance belongs to a different org
   * @throws {@link TripNotAssignedToDriverError} if a DRIVER caller is not the
   *   assigned driver, has no active driver profile, or is INACTIVE/SUSPENDED
   * @throws {@link DriverTripStatusTransitionForbiddenError} if a DRIVER caller
   *   requests a target outside of `IN_PROGRESS` / `FINISHED`
   * @throws {@link InvalidTripStatusTransitionError} if the transition violates the state machine
   * @throws {@link TripInstanceRequiredFieldError} if driver or vehicle is missing when required
   */
  async execute(
    id: string,
    input: TransitionTripInstanceStatusDto,
    organizationId: string,
    actorContext?: TripStatusActorContext,
  ): Promise<TripInstance> {
    return this.unitOfWork.execute(async () => {
      const instance = await this.tripInstanceRepository.findById(id);

      if (!instance) {
        throw new TripInstanceNotFoundError(id);
      }

      if (instance.organizationId !== organizationId) {
        throw new TripInstanceAccessForbiddenError(id);
      }

      if (actorContext?.role === RoleName.DRIVER) {
        if (!DRIVER_ALLOWED_TARGETS.includes(input.newStatus)) {
          throw new DriverTripStatusTransitionForbiddenError(input.newStatus);
        }
        const driver = await this.driverRepository.findByUserId(
          actorContext.userId,
        );
        if (
          !driver ||
          driver.driverStatus !== DriverStatus.ACTIVE ||
          instance.driverId !== driver.id
        ) {
          throw new TripNotAssignedToDriverError(id);
        }
      }

      instance.transitionTo(input.newStatus);

      const updated = await this.tripInstanceRepository.update(instance);

      if (!updated) {
        throw new TripInstanceNotFoundError(id);
      }

      return updated;
    });
  }
}
