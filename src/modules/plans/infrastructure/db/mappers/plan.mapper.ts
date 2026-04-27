import type { Plan as PrismaPlan } from 'generated/prisma/client';
import { Money } from 'src/shared/domain/entities/value-objects';
import { PlanEntity } from 'src/modules/plans/domain/entities/plan.entity';
import { PlanName } from 'src/modules/plans/domain/interfaces/enums/plan-name.enum';

/**
 * Bidirectional mapper between the Prisma `Plan` model and the {@link PlanEntity} domain object.
 *
 * Contains no business logic — only field-level translations between persistence
 * and domain representations.
 */
export class PlanMapper {
  /**
   * Converts a raw Prisma `Plan` record to a {@link PlanEntity} domain object.
   *
   * Casts `price` from `Prisma.Decimal` to `number` via `Number()` and
   * reconstructs the {@link Money} Value Object from that value.
   *
   * @param raw - Raw `Plan` record returned by the Prisma client
   * @returns A fully hydrated {@link PlanEntity} instance
   */
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

  /**
   * Converts a {@link PlanEntity} to the plain object expected by the Prisma `create` / `update` methods.
   *
   * The `id` and `createdAt` fields are intentionally omitted because they are
   * managed by the database (auto-increment and server default respectively).
   *
   * @param entity - The {@link PlanEntity} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.plan.create({ data })`
   */
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
