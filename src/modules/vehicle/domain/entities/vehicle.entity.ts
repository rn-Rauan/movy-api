
import { VehicleStatus } from '../interfaces/enums/vehicle-status.enum';
import { VehicleType } from '../interfaces/enums/vehicle-type.enum';
import { InvalidMaxCapacityError } from './errors/vehicle.errors';
import { Plate } from './value-objects/plate.value-object';

/**
 * Interface that defines the properties of the Vehicle entity.
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
 * Entity Vehicle
 *
 * Responsibility:
 * - Manage vehicle data owned by an organization
 * - Validate data integrity (capacity, plate, type)
 * - Encapsulate business rules (activate/deactivate)
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
   * Create a new Vehicle instance, running domain invariant checks.
   * @throws InvalidMaxCapacityError if maxCapacity is not a positive integer
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
   * Restore an existing Vehicle instance from persistence (skips invariant checks).
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
}
