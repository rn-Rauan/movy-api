import { Injectable } from '@nestjs/common';
import { TripTemplate } from 'src/modules/trip/domain/entities';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { TripTemplateMapper } from '../mappers/trip-template.mapper';

@Injectable()
export class PrismaTripTemplateRepository implements TripTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param tripTemplate - TripTemplate to persist
   * @returns TripTemplate created or null
   */
  async save(tripTemplate: TripTemplate): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.create({
      data: TripTemplateMapper.toPersistence(tripTemplate),
    });

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * @param id - UUID of the trip template
   * @returns TripTemplate or null if not found
   */
  async findById(id: string): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.findUnique({
      where: { id },
    });

    if (!tripTemplateData) return null;

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripTemplate list
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [tripTemplates, total] = await this.prisma.$transaction([
      this.prisma.tripTemplate.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tripTemplate.count({ where: { organizationId } }),
    ]);

    return {
      data: tripTemplates.map((template) => TripTemplateMapper.toDomain(template)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with active TripTemplate list
   */
  async findActiveByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [tripTemplates, total] = await this.prisma.$transaction([
      this.prisma.tripTemplate.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tripTemplate.count({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      data: tripTemplates.map((template) => TripTemplateMapper.toDomain(template)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * @param tripTemplate - TripTemplate with updated data
   * @returns TripTemplate updated or null
   */
  async update(tripTemplate: TripTemplate): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.update({
      where: { id: tripTemplate.id },
      data: TripTemplateMapper.toPersistence(tripTemplate),
    });

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * @param id - UUID of the trip template to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tripTemplate.delete({ where: { id } });
  }
}
