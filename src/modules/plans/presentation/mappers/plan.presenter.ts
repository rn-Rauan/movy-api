import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanResponseDto } from '../../application/dtos/plan-response.dto';

export class PlanPresenter {
  static toHTTP(entity: PlanEntity): PlanResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      price: entity.price.toNumber(),
      maxVehicles: entity.maxVehicles,
      maxDrivers: entity.maxDrivers,
      maxMonthlyTrips: entity.maxMonthlyTrips,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toHTTPList(entities: PlanEntity[]): PlanResponseDto[] {
    return entities.map((entity) => PlanPresenter.toHTTP(entity));
  }
}
