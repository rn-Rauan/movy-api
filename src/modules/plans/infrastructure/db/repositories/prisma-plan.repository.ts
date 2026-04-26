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

@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(plan: PlanEntity): Promise<PlanEntity | null> {
    const data = PlanMapper.toPersistence(plan);
    const result = await this.prisma.plan.create({ data });
    return result ? PlanMapper.toDomain(result) : null;
  }

  async update(plan: PlanEntity): Promise<PlanEntity | null> {
    const data = PlanMapper.toPersistence(plan);
    const result = await this.prisma.plan.update({
      where: { id: plan.id },
      data,
    });
    return result ? PlanMapper.toDomain(result) : null;
  }

  async findById(id: number): Promise<PlanEntity | null> {
    const result = await this.prisma.plan.findUnique({ where: { id } });
    return result ? PlanMapper.toDomain(result) : null;
  }

  async findByName(name: PlanName): Promise<PlanEntity | null> {
    const result = await this.prisma.plan.findUnique({ where: { name } });
    return result ? PlanMapper.toDomain(result) : null;
  }

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
