import { VehicleStatus } from '../interfaces/enums/vehicle-status.enum';
import { VehicleType } from '../interfaces/enums/vehicle-type.enum';
import { InvalidMaxCapacityError } from './errors/vehicle.errors';
import { Plate } from './value-objects/plate.value-object';

/**
 * Internal property bag for the {@link VehicleEntity} aggregate.
 * @internal
 */
export interface VehicleProps {
  readonly id: string;
  plate: Plate;
  model: string;
  type: VehicleType;
  maxCapacity: number;
  organizationId: string;
  status?: VehicleStatus;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Aggregate root representing a physical vehicle registered to an organisation.
 *
 * @remarks
 * - `plate` is a {@link Plate} Value Object enforcing Brazilian plate formats
 *   (old `ABC1234` or Mercosul `ABC1D23`)
 * - `maxCapacity` must be a positive integer; violations throw {@link InvalidMaxCapacityError}
 * - Status defaults to {@link VehicleStatus.ACTIVE} on creation; use `activate()` /
 *   `deactivate()` to toggle
 * - `updatedAt` is refreshed automatically on every mutating operation
 *
 * @see {@link Plate}
 * @see {@link VehicleType}
 * @see {@link VehicleStatus}
 */
export class VehicleEntity {
  private readonly props: Required<VehicleProps>;

  private constructor(props: VehicleProps) {
    const now = new Date();

    this.props = {
      ...props,
      status: props.status ?? VehicleStatus.ACTIVE,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Creates a new {@link VehicleEntity}, enforcing domain invariants.
   *
   * @param props - Vehicle data excluding audit timestamps and status
   * @returns A new {@link VehicleEntity} with status `ACTIVE`
   * @throws {@link InvalidMaxCapacityError} if `maxCapacity` is not a positive integer
   */
  static create(
    props: Omit<VehicleProps, 'createdAt' | 'updatedAt' | 'status'>,
  ): VehicleEntity {
    if (!Number.isInteger(props.maxCapacity) || props.maxCapacity <= 0) {
      throw new InvalidMaxCapacityError(props.maxCapacity);
    }
    return new VehicleEntity(props);
  }

  /**
   * Reconstructs a {@link VehicleEntity} from a persistence record.
   *
   * Skips all domain invariant checks — the data is assumed valid since
   * it was originally written through the domain layer.
   *
   * @param props - Full property snapshot from the database
   * @returns A fully hydrated {@link VehicleEntity}
   */
  static restore(props: VehicleProps): VehicleEntity {
    return new VehicleEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get plate(): Plate {
    return this.props.plate;
  }

  get model(): string {
    return this.props.model;
  }

  get type(): VehicleType {
    return this.props.type;
  }

  get maxCapacity(): number {
    return this.props.maxCapacity;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get status(): VehicleStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Activate the vehicle, making it available for trips. */
  activate(): void {
    this.props.status = VehicleStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  /** Deactivate the vehicle, preventing it from being assigned to trips. */
  deactivate(): void {
    this.props.status = VehicleStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  /** Returns true when the vehicle is in active status. */
  isActive(): boolean {
    return this.props.status === VehicleStatus.ACTIVE;
  }

  /**
   * Update the vehicle's plate.
   * @param plate - New validated Plate value object
   */
  updatePlate(plate: Plate): void {
    this.props.plate = plate;
    this.props.updatedAt = new Date();
  }

  /**
   * Update the max passenger capacity.
   * @throws InvalidMaxCapacityError if the new value is not a positive integer
   */
  updateMaxCapacity(capacity: number): void {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new InvalidMaxCapacityError(capacity);
    }
    this.props.maxCapacity = capacity;
    this.props.updatedAt = new Date();
  }

  /** Update the vehicle model description. */
  updateModel(model: string): void {
    this.props.model = model;
    this.props.updatedAt = new Date();
  }

  /** Update the vehicle type. */
  updateType(type: VehicleType): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }
}
