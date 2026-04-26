import type { Plan as PrismaPlan } from 'generated/prisma/client';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanEntity } from 'src/modules/plans/domain/entities/plan.entity';
import { PlanName } from 'src/modules/plans/domain/interfaces/enums/plan-name.enum';

export class PlanMapper {
  static toDomain(raw: PrismaPlan): PlanEntity {
    return PlanEntity.restore({
      id: raw.id,
      name: raw.name as PlanName,
      price: Money.restore(Number(raw.price)),
      maxVehicles: raw.maxVehicles,
      maxDrivers: raw.maxDrivers,
      maxMonthlyTrips: raw.maxMonthlyTrips,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: PlanEntity) {
    return {
      name: entity.name,
      price: entity.price.toNumber(),
      maxVehicles: entity.maxVehicles,
      maxDrivers: entity.maxDrivers,
      maxMonthlyTrips: entity.maxMonthlyTrips,
      isActive: entity.isActive,
    };
  }
}
