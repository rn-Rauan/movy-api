import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanName } from '../interfaces/enums/plan-name.enum';

/**
 * @internal Internal state bag of a plan entity.
 * Fields without `readonly` can be mutated through the entity's public methods.
 */
interface PlanState {
  readonly id: number;
  readonly name: PlanName;
  price: Money;
  maxVehicles: number;
  maxDrivers: number;
  maxMonthlyTrips: number;
  durationDays: number;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanProps {
  name: PlanName;
  price: Money;
  maxVehicles: number;
  maxDrivers: number;
  maxMonthlyTrips: number;
  durationDays: number;
}

export class PlanEntity {
  private readonly props: PlanState;

  private constructor(props: PlanState) {
    this.props = props;
  }

  /**
   * Creates a new plan entity with `isActive = true` and both timestamps set to **now**.
   *
   * The `id` field defaults to `0` until the entity is saved to the database by the
   * infrastructure repository.
   *
   * @param props - Initial values for the new plan (name, price, limits)
   * @returns A new {@link PlanEntity} instance ready to be persisted
   */
  static create(props: CreatePlanProps): PlanEntity {
    const now = new Date();
    return new PlanEntity({
      ...props,
      id: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstructs a plan entity from a persisted database record.
   *
   * Intended for **exclusive** use by the infrastructure mapper.
   * Do not call this method from application or domain code.
   *
   * @param props - Complete state as returned by the database
   * @returns A {@link PlanEntity} instance that mirrors the stored state
   */
  static restore(props: PlanState): PlanEntity {
    return new PlanEntity(props);
  }

  /**
   * Updates the mutable fields of the plan and refreshes `updatedAt` automatically.
   *
   * The `name` field is immutable after creation and will be silently ignored
   * even if it is included in `props`.
   *
   * @param props - Partial set of fields to change; omitted fields remain unchanged
   */
  update(props: Partial<CreatePlanProps>): void {
    if (props.price !== undefined) this.props.price = props.price;
    if (props.maxVehicles !== undefined)
      this.props.maxVehicles = props.maxVehicles;
    if (props.maxDrivers !== undefined)
      this.props.maxDrivers = props.maxDrivers;
    if (props.maxMonthlyTrips !== undefined)
      this.props.maxMonthlyTrips = props.maxMonthlyTrips;
    if (props.durationDays !== undefined)
      this.props.durationDays = props.durationDays;
    this.props.updatedAt = new Date();
  }

  /**
   * Marks the plan as inactive, preventing new subscriptions from being created.
   *
   * Existing active subscriptions are **not** affected and remain valid until they expire.
   * Updates `updatedAt` to the current timestamp.
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  get id(): number {
    return this.props.id;
  }
  get name(): PlanName {
    return this.props.name;
  }
  get price(): Money {
    return this.props.price;
  }
  get maxVehicles(): number {
    return this.props.maxVehicles;
  }
  get maxDrivers(): number {
    return this.props.maxDrivers;
  }
  get maxMonthlyTrips(): number {
    return this.props.maxMonthlyTrips;
  }
  get durationDays(): number {
    return this.props.durationDays;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
