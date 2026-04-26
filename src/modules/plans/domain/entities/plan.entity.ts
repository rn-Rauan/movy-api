import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanName } from '../interfaces/enums/plan-name.enum';

interface PlanState {
  readonly id: number;
  readonly name: PlanName;
  price: Money;
  maxVehicles: number;
  maxDrivers: number;
  maxMonthlyTrips: number;
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
}

export class PlanEntity {
  private readonly props: PlanState;

  private constructor(props: PlanState) {
    this.props = props;
  }

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

  static restore(props: PlanState): PlanEntity {
    return new PlanEntity(props);
  }

  update(props: Partial<CreatePlanProps>): void {
    if (props.price !== undefined) this.props.price = props.price;
    if (props.maxVehicles !== undefined)
      this.props.maxVehicles = props.maxVehicles;
    if (props.maxDrivers !== undefined)
      this.props.maxDrivers = props.maxDrivers;
    if (props.maxMonthlyTrips !== undefined)
      this.props.maxMonthlyTrips = props.maxMonthlyTrips;
    this.props.updatedAt = new Date();
  }

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
