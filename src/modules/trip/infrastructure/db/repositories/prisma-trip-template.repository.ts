import { Injectable } from '@nestjs/common';
import { TripTemplate } from 'src/modules/trip/domain/entities';
import { TripTemplateRepository } from 'src/modules/trip/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { TripTemplateMapper } from '../mappers/trip-template.mapper';

/**
 * Prisma-backed implementation of {@link TripTemplateRepository}.
 *
 * All I/O operations target the `tripTemplate` table via the Prisma Client.
 * Uses interactive transactions (`$transaction`) for paginated list methods
 * to guarantee consistency between the `findMany` result and the `count`.
 */
@Injectable()
export class PrismaTripTemplateRepository implements TripTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts a new template row via `prisma.tripTemplate.create`.
   *
   * @param tripTemplate - The {@link TripTemplate} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(tripTemplate: TripTemplate): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.create({
      data: TripTemplateMapper.toPersistence(tripTemplate),
    });

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * Finds a template by UUID via `prisma.tripTemplate.findUnique`.
   *
   * @param id - UUID of the trip template
   * @returns The matching {@link TripTemplate}, or `null` if not found
   */
  async findById(id: string): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.findUnique({
      where: { id },
    });

    if (!tripTemplateData) return null;

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * Returns a paginated list of all templates for an organisation,
   * ordered by `createdAt` descending. Uses an interactive transaction.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripTemplate} items
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
      data: tripTemplates.map((template) =>
        TripTemplateMapper.toDomain(template),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of `ACTIVE`-only templates for an organisation,
   * ordered by `createdAt` descending. Uses an interactive transaction.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link TripTemplate} items
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
      data: tripTemplates.map((template) =>
        TripTemplateMapper.toDomain(template),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates an existing template row via `prisma.tripTemplate.update`.
   *
   * @param tripTemplate - The {@link TripTemplate} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(tripTemplate: TripTemplate): Promise<TripTemplate | null> {
    const tripTemplateData = await this.prisma.tripTemplate.update({
      where: { id: tripTemplate.id },
      data: TripTemplateMapper.toPersistence(tripTemplate),
    });

    return TripTemplateMapper.toDomain(tripTemplateData);
  }

  /**
   * Hard-deletes a template row via `prisma.tripTemplate.delete`.
   *
   * @param id - UUID of the trip template to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tripTemplate.delete({ where: { id } });
  }
}
