import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
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
 * This class is registered in the NestJS DI container as the concrete provider
 * for the `PlanRepository` abstract token.
 */
@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts a new plan row via `prisma.plan.create`.
   *
   * @param plan - The {@link PlanEntity} to persist
   * @returns The saved entity with its database-assigned `id`, or `null` on unexpected failure
   */
  async save(plan: PlanEntity): Promise<PlanEntity | null> {
    const data = PlanMapper.toPersistence(plan);
    const result = await this.prisma.plan.create({ data });
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
    const result = await this.prisma.plan.update({
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
    const result = await this.prisma.plan.findUnique({ where: { id } });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Finds a single plan by its unique name column via `prisma.plan.findUnique`.
   *
   * @param name - A {@link PlanName} enum value
   * @returns The matching {@link PlanEntity}, or `null` if not found
   */
  async findByName(name: PlanName): Promise<PlanEntity | null> {
    const result = await this.prisma.plan.findUnique({ where: { name } });
    return result ? PlanMapper.toDomain(result) : null;
  }

  /**
   * Returns a paginated list of plans ordered by `id` ascending.
   *
   * Uses a Prisma interactive transaction to guarantee consistency between the
   * `findMany` result set and the `count` used for pagination metadata.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} with the page of plan entities and pagination metadata
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PlanEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [plans, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({ orderBy: { id: 'asc' }, skip, take: limit }),
      this.prisma.plan.count(),
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
