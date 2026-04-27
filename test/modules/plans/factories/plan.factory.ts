import { PlanEntity } from 'src/modules/plans/domain/entities/plan.entity';
import { PlanName } from 'src/modules/plans/domain/interfaces/enums/plan-name.enum';
import { Money } from 'src/shared/domain/entities/value-objects';

type PlanOverrides = Partial<{
  id: number;
  name: PlanName;
  price: number;
  maxVehicles: number;
  maxDrivers: number;
  maxMonthlyTrips: number;
  durationDays: number;
  isActive: boolean;
}>;

export function makePlan(overrides: PlanOverrides = {}): PlanEntity {
  return PlanEntity.restore({
    id: overrides.id ?? 1,
    name: overrides.name ?? PlanName.BASIC,
    price: Money.restore(overrides.price ?? 49.9),
    maxVehicles: overrides.maxVehicles ?? 5,
    maxDrivers: overrides.maxDrivers ?? 10,
    maxMonthlyTrips: overrides.maxMonthlyTrips ?? 60,
    durationDays: overrides.durationDays ?? 30,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
