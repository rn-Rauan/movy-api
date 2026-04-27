import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanResponseDto } from '../../application/dtos/plan-response.dto';

/**
 * Serialises a {@link PlanEntity} domain object into the HTTP response shape {@link PlanResponseDto}.
 *
 * Responsible for unwrapping the {@link Money} Value Object into a plain `number`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class PlanPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param entity - The {@link PlanEntity} to serialise
   * @returns A {@link PlanResponseDto} safe to include in an HTTP response
   */
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

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link PlanEntity} instances to serialise
   * @returns Array of {@link PlanResponseDto} objects
   */
  static toHTTPList(entities: PlanEntity[]): PlanResponseDto[] {
    return entities.map((entity) => PlanPresenter.toHTTP(entity));
  }
}
