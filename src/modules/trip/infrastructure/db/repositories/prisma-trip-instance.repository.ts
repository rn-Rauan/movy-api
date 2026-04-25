import { Injectable } from '@nestjs/common';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripInstanceRepository } from 'src/modules/trip/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { TripInstanceMapper } from '../mappers/trip-instance.mapper';

@Injectable()
export class PrismaTripInstanceRepository implements TripInstanceRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Persists a new trip instance entity.
   * @param entity - TripInstance to save
   * @returns TripInstance persisted or null
   */
  async save(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.create({
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Updates an existing trip instance entity.
   * @param entity - TripInstance with updated data
   * @returns TripInstance updated or null
   */
  async update(entity: TripInstance): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.update({
      where: { id: entity.id },
      data: TripInstanceMapper.toPersistence(entity),
    });

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Deletes a trip instance by its unique identifier.
   * @param id - UUID of the trip instance to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tripInstance.delete({ where: { id } });
  }

  /**
   * Finds a trip instance by its unique ID.
   * @param id - UUID of the trip instance
   * @returns TripInstance or null if not found
   */
  async findById(id: string): Promise<TripInstance | null> {
    const data = await this.prisma.tripInstance.findUnique({
      where: { id },
    });

    if (!data) return null;

    return TripInstanceMapper.toDomain(data);
  }

  /**
   * Lists all trip instances with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
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
   * Lists trip instances belonging to a specific organization, ordered by departure time.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
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
   * Lists trip instances belonging to a specific trip template, ordered by departure time.
   * @param templateId - UUID of the trip template
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
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
