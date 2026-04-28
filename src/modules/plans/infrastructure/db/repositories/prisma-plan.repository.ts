import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PlanEntity } from 'src/modules/plans/domain/entities/plan.entity';
import { PlanRepository } from 'src/modules/plans/domain/interfaces/plan.repository';
import { PlanName } from 'src/modules/plans/domain/interfaces/enums/plan-name.enum';
import { PlanMapper } from '../mappers/plan.mapper';

/**
 * Prisma-backed implementation of {@link PlanRepository}.
 *
 * All I/O operations are performed via the Prisma Client targeting PostgreSQL.
 */
@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new plan row via `prisma.plan.create`.
   *
   * @param plan - The {@link PlanEntity} to persist
   * @returns The saved entity with its database-assigned `id`, or `null` on unexpected failure
   */
  async save(plan: PlanEntity): Promise<PlanEntity | null> {
    const data = PlanMapper.toPersistence(plan);
    const result = await this.db.plan.create({ data });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Updates an existing plan row via `prisma.plan.update`.
   *
   * @param plan - The {@link PlanEntity} containing the updated state
   * @returns The updated entity, or `null` if the record no longer exists
   */
  async update(plan: PlanEntity): Promise<PlanEntity | null> {
    const data = PlanMapper.toPersistence(plan);
    const result = await this.db.plan.update({
      where: { id: plan.id },
      data,
    });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Finds a single plan by its numeric primary key via `prisma.plan.findUnique`.
   *
   * @param id - The plan's numeric primary key
   * @returns The matching {@link PlanEntity}, or `null` if not found
   */
  async findById(id: number): Promise<PlanEntity | null> {
    const result = await this.db.plan.findUnique({ where: { id } });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Finds a single plan by its unique name column via `prisma.plan.findUnique`.
   *
   * @param name - A {@link PlanName} enum value
   * @returns The matching {@link PlanEntity}, or `null` if not found
   */
  async findByName(name: PlanName): Promise<PlanEntity | null> {
    const result = await this.db.plan.findUnique({ where: { name } });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Returns a paginated list of plans ordered by `id` ascending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} with the page of plan entities and pagination metadata
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PlanEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      this.db.plan.findMany({ orderBy: { id: 'asc' }, skip, take: limit }),
      this.db.plan.count(),
    ]);

    return {
      data: plans.map((plan) => PlanMapper.toDomain(plan)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
