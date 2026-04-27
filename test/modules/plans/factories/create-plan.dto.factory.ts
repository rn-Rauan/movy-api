import { CreatePlanDto } from 'src/modules/plans/application/dtos/create-plan.dto';
import { PlanName } from 'src/modules/plans/domain/interfaces/enums/plan-name.enum';

type CreatePlanDtoOverrides = Partial<CreatePlanDto>;

export function makeCreatePlanDto(overrides: CreatePlanDtoOverrides = {}): CreatePlanDto {
  return {
    name: overrides.name ?? PlanName.BASIC,
    price: overrides.price ?? 49.9,
    maxVehicles: overrides.maxVehicles ?? 5,
    maxDrivers: overrides.maxDrivers ?? 10,
    maxMonthlyTrips: overrides.maxMonthlyTrips ?? 60,
    durationDays: overrides.durationDays ?? 30,
  };
}
