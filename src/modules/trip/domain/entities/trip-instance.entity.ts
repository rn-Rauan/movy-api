import { Money } from 'src/shared/domain/entities/value-objects';
import { TripStatus } from '../interfaces';
import {
  InvalidTripInstanceAutoCancelTimeError,
  InvalidTripInstanceCapacityError,
  InvalidTripInstanceTimesError,
  InvalidTripStatusTransitionError,
  TripInstanceRequiredFieldError,
} from './errors/trip-instance.errors';

/**
 * Props passed to the TripInstance entity during creation and restoration.
 */
export interface TripInstanceProps {
  readonly id: string;
  readonly organizationId: string;
  readonly tripTemplateId: string;
  driverId: string | null;
  vehicleId: string | null;
  tripStatus: TripStatus;
  minRevenue: Money | null;
  autoCancelAt: Date | null;
  forceConfirm: boolean;
  totalCapacity: number;
  departureTime: Date;
  arrivalEstimate: Date;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Internal state for the TripInstance entity.
 */
interface TripInstanceState {
  readonly id: string;
  readonly organizationId: string;
  readonly tripTemplateId: string;
  driverId: string | null;
  vehicleId: string | null;
  tripStatus: TripStatus;
  minRevenue: Money | null;
  autoCancelAt: Date | null;
  forceConfirm: boolean;
  totalCapacity: number;
  departureTime: Date;
  arrivalEstimate: Date;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity TripInstance
 *
 * Responsibility:
 * - Represents a specific execution of a TripTemplate
 * - Maintains historical data (snapshot of vehicle capacity and pricing)
 * - Manages trip lifecycle states (Draft -> Scheduled -> Confirmed -> In Progress -> Finished/Canceled)
 * - Validates temporal and status-based invariants
 *
 * State Machine:
 *   DRAFT       → SCHEDULED (requires driver + vehicle) | CANCELED
 *   SCHEDULED   → CONFIRMED (requires driver + vehicle) | CANCELED
 *   CONFIRMED   → IN_PROGRESS (requires driver + vehicle) | SCHEDULED (revert) | CANCELED
 *   IN_PROGRESS → FINISHED | CANCELED
 *   FINISHED    → terminal
 *   CANCELED    → terminal
 */
export class TripInstance {
  private readonly props: TripInstanceState;

  private constructor(props: TripInstanceProps) {
    const now = new Date();

    this.props = {
      ...props,
      autoCancelAt: props.autoCancelAt ? new Date(props.autoCancelAt) : null,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Create a new TripInstance, running domain invariant checks.
   * Newly created instances start as DRAFT — driver and vehicle must be assigned
   * before the admin can schedule the trip.
   * @throws InvalidTripInstanceCapacityError if totalCapacity <= 0
   * @throws InvalidTripInstanceTimesError if departureTime >= arrivalEstimate
   * @throws InvalidTripInstanceAutoCancelTimeError if autoCancelAt is after departureTime
   */
  static create(
    props: Omit<TripInstanceProps, 'createdAt' | 'updatedAt' | 'tripStatus' | 'forceConfirm'>,
  ): TripInstance {
    TripInstance.validateCapacity(props.totalCapacity);
    TripInstance.validateTimes(props.departureTime, props.arrivalEstimate);
    
    if (props.autoCancelAt) {
      TripInstance.validateAutoCancel(new Date(props.autoCancelAt), props.departureTime);
    }

    return new TripInstance({
      ...props,
      tripStatus: TripStatus.DRAFT,
      forceConfirm: false,
    });
  }

  /**
   * Restore an existing TripInstance from persistence (skips domain validation).
   */
  static restore(props: TripInstanceProps): TripInstance {
    return new TripInstance(props);
  }

  /** Validates that the trip total capacity is positive */
  private static validateCapacity(capacity: number): void {
    if (capacity <= 0) {
      throw new InvalidTripInstanceCapacityError(capacity);
    }
  }

  /** Validates that the arrival estimate occurs after the departure time */
  private static validateTimes(departure: Date, arrival: Date): void {
    if (arrival <= departure) {
      throw new InvalidTripInstanceTimesError();
    }
  }

  /** Validates that auto-cancel evaluation time happens before the actual trip departure */
  private static validateAutoCancel(autoCancel: Date, departure: Date): void {
    if (autoCancel >= departure) {
      throw new InvalidTripInstanceAutoCancelTimeError();
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get tripTemplateId(): string { return this.props.tripTemplateId; }
  get driverId(): string | null { return this.props.driverId; }
  get vehicleId(): string | null { return this.props.vehicleId; }
  get tripStatus(): TripStatus { return this.props.tripStatus; }
  get minRevenue(): Money | null { return this.props.minRevenue; }
  get autoCancelAt(): Date | null { return this.props.autoCancelAt; }
  get forceConfirm(): boolean { return this.props.forceConfirm; }
  get totalCapacity(): number { return this.props.totalCapacity; }
  get departureTime(): Date { return this.props.departureTime; }
  get arrivalEstimate(): Date { return this.props.arrivalEstimate; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Transitions the trip instance to a new status, checking for valid state machine transitions.
   * @throws InvalidTripStatusTransitionError if the transition is illegal
   * @throws TripInstanceRequiredFieldError if driver/vehicle is missing when scheduling/confirming
   */
  transitionTo(newStatus: TripStatus): void {
    const current = this.props.tripStatus;

    if (current === newStatus) return;

    // Transition Rules
    switch (current) {
      case TripStatus.DRAFT:
        if (newStatus === TripStatus.SCHEDULED) {
          this.validateSchedulingPrerequisites();
        } else if (newStatus !== TripStatus.CANCELED) {
          throw new InvalidTripStatusTransitionError(current, newStatus);
        }
        break;

      case TripStatus.SCHEDULED:
        if (newStatus === TripStatus.CONFIRMED) {
          this.validateSchedulingPrerequisites();
        } else if (newStatus !== TripStatus.CANCELED) {
          throw new InvalidTripStatusTransitionError(current, newStatus);
        }
        break;

      case TripStatus.CONFIRMED:
        if (newStatus === TripStatus.IN_PROGRESS) {
          this.validateSchedulingPrerequisites();
        } else if (newStatus !== TripStatus.CANCELED && newStatus !== TripStatus.SCHEDULED) {
          throw new InvalidTripStatusTransitionError(current, newStatus);
        }
        break;

      case TripStatus.IN_PROGRESS:
        if (newStatus !== TripStatus.FINISHED && newStatus !== TripStatus.CANCELED) {
          throw new InvalidTripStatusTransitionError(current, newStatus);
        }
        break;

      case TripStatus.FINISHED:
      case TripStatus.CANCELED:
        throw new InvalidTripStatusTransitionError(current, newStatus);

      default:
        throw new InvalidTripStatusTransitionError(current, newStatus);
    }

    this.props.tripStatus = newStatus;
    this.props.updatedAt = new Date();
  }

  /** Ensures that a driver and vehicle are assigned before scheduling, confirming or starting the trip */
  private validateSchedulingPrerequisites(): void {
    if (!this.props.driverId) {
      throw new TripInstanceRequiredFieldError('driverId', TripStatus.SCHEDULED);
    }
    if (!this.props.vehicleId) {
      throw new TripInstanceRequiredFieldError('vehicleId', TripStatus.SCHEDULED);
    }
  }

  /** Manually forces the trip confirmation, bypassing revenue checks at the application level */
  setForceConfirm(value: boolean): void {
    this.props.forceConfirm = value;
    this.props.updatedAt = new Date();
  }

  /** Assigns a specific driver to this trip instance */
  assignDriver(driverId: string | null): void {
    this.props.driverId = driverId;
    this.props.updatedAt = new Date();
  }

  /** Assigns a specific vehicle to this trip instance */
  assignVehicle(vehicleId: string | null): void {
    this.props.vehicleId = vehicleId;
    this.props.updatedAt = new Date();
  }
}
