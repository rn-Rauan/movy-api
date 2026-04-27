import { Injectable } from '@nestjs/common';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { TripInstanceMapper } from '../mappers/trip-instance.mapper';

/**
 * Prisma-backed implementation of {@link TripInstanceRepository}.
 *
 * All I/O operations target the `tripInstance` table via the Prisma Client.
 * Uses interactive transactions (`$transaction`) for paginated list methods
 * to guarantee consistency between the `findMany` result and the `count`.
 */
@Injectable()
export class PrismaTripInstanceRepository implements TripInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts a new instance row via `prisma.tripInstance.create`.
   *
   * @param entity - The {@link TripInstance} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.create({
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Updates an existing instance row via `prisma.tripInstance.update`.
   *
   * @param entity - The {@link TripInstance} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.update({
      where: { id: entity.id },
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Hard-deletes an instance row via `prisma.tripInstance.delete`.
   *
   * @param id - UUID of the trip instance to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tripInstance.delete({ where: { id } });
  }

  /**
   * Finds an instance by UUID via `prisma.tripInstance.findUnique`.
   *
   * @param id - UUID of the trip instance
   * @returns The matching {@link TripInstance}, or `null` if not found
   */
  async findById(id: string): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.findUnique({
      where: { id },
    });

    if (!data) return null;

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Returns a paginated list of all instances ordered by `departureTime` ascending.
   *
   * Uses an interactive transaction for count consistency.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await this.prisma.$transaction([
      this.prisma.tripInstance.findMany({
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.tripInstance.count(),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of instances for an organisation,
   * ordered by `departureTime` ascending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await this.prisma.$transaction([
      this.prisma.tripInstance.findMany({
        where: { organizationId },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.tripInstance.count({ where: { organizationId } }),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of instances for a specific template,
   * ordered by `departureTime` ascending.
   *
   * @param templateId - UUID of the parent trip template
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async findByTemplateId(
    templateId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [instances, total] = await this.prisma.$transaction([
      this.prisma.tripInstance.findMany({
        where: { tripTemplateId: templateId },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.tripInstance.count({ where: { tripTemplateId: templateId } }),
    ]);

    return {
      data: instances.map((instance) => TripInstanceMapper.toDomain(instance)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
