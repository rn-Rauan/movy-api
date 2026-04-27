import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PlanEntity } from '../entities/plan.entity';
import { PlanName } from './enums/plan-name.enum';

/**
 * Repository contract for {@link PlanEntity}.
 *
 * The concrete implementation lives at
 * `infrastructure/db/repositories/prisma-plan.repository.ts`.
 * This abstract class is registered in the NestJS DI container as a token so that
 * use cases depend only on the interface, not on the Prisma client.
 */
export abstract class PlanRepository {
  /**
   * Persists a new plan record in the database.
   *
   * @param plan - The {@link PlanEntity} instance to save
   * @returns The saved entity with its database-assigned `id`, or `null` on failure
   */
  abstract save(plan: PlanEntity): Promise<PlanEntity | null>;

  /**
   * Updates an existing plan record.
   *
   * @param plan - The {@link PlanEntity} instance with updated state
   * @returns The updated entity, or `null` if the record was not found
   */
  abstract update(plan: PlanEntity): Promise<PlanEntity | null>;

  /**
   * Finds a plan by its numeric primary key.
   *
   * @param id - The database-assigned numeric id
   * @returns The matching {@link PlanEntity}, or `null` if not found
   */
  abstract findById(id: number): Promise<PlanEntity | null>;

  /**
   * Finds a plan by its unique name.
   *
   * @param name - A {@link PlanName} enum value
   * @returns The matching {@link PlanEntity}, or `null` if not found
   */
  abstract findByName(name: PlanName): Promise<PlanEntity | null>;

  /**
   * Returns a paginated list of all plans, ordered by `id` ascending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} containing the requested page of plans
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PlanEntity>>;
}
