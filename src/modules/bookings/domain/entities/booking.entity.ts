import { Money } from 'src/shared/domain/entities/value-objects';
import type { Status } from 'src/shared/domain/types';
import { EnrollmentType } from '../interfaces';
import {
  InvalidBookingStopError,
} from './errors/booking.errors';

export interface BookingProps {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly tripInstanceId: string;
  enrollmentDate: Date;
  status: Status;
  presenceConfirmed: boolean;
  enrollmentType: EnrollmentType;
  recordedPrice: Money;
  boardingStop: string;
  alightingStop: string;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

interface BookingState {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly tripInstanceId: string;
  enrollmentDate: Date;
  status: Status;
  presenceConfirmed: boolean;
  enrollmentType: EnrollmentType;
  recordedPrice: Money;
  boardingStop: string;
  alightingStop: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity Booking (maps to `enrollment` table)
 *
 * Responsibility:
 * - Represent a passenger's reservation for a specific TripInstance
 * - Record the price at the time of booking (snapshot)
 * - Validate boarding/alighting stop invariants
 * - Manage presence confirmation lifecycle
 */
export class Booking {
  private readonly props: BookingState;

  private constructor(props: BookingProps) {
    const now = new Date();

    this.props = {
      ...props,
      boardingStop: props.boardingStop.trim(),
      alightingStop: props.alightingStop.trim(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Create a new Booking, running domain invariant checks.
   * @throws InvalidBookingStopError if stops are empty or equal
   */
  static create(
    props: Omit<BookingProps, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'presenceConfirmed' | 'enrollmentDate'>,
  ): Booking {
    Booking.validateStops(props.boardingStop, props.alightingStop);

    return new Booking({
      ...props,
      id: crypto.randomUUID(),
      status: 'ACTIVE',
      presenceConfirmed: false,
      enrollmentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Restore a Booking from persistence (skips invariant validation).
   */
  static restore(props: BookingProps): Booking {
    return new Booking(props);
  }

  private static validateStops(boarding: string, alighting: string): void {
    if (!boarding.trim()) {
      throw new InvalidBookingStopError('boardingStop cannot be empty');
    }
    if (!alighting.trim()) {
      throw new InvalidBookingStopError('alightingStop cannot be empty');
    }
    if (boarding.trim() === alighting.trim()) {
      throw new InvalidBookingStopError(
        'boardingStop and alightingStop must be different',
      );
    }
  }

  confirmPresence(): void {
    this.props.presenceConfirmed = true;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get userId(): string { return this.props.userId; }
  get tripInstanceId(): string { return this.props.tripInstanceId; }
  get enrollmentDate(): Date { return this.props.enrollmentDate; }
  get status(): Status { return this.props.status; }
  get presenceConfirmed(): boolean { return this.props.presenceConfirmed; }
  get enrollmentType(): EnrollmentType { return this.props.enrollmentType; }
  get recordedPrice(): Money { return this.props.recordedPrice; }
  get boardingStop(): string { return this.props.boardingStop; }
  get alightingStop(): string { return this.props.alightingStop; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
