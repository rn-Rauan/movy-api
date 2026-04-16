import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { DriverRepository } from '../../../domain/interfaces';
import { DriverEntity } from '../../../domain/entities/driver.entity';
import { DriverMapper } from '../mappers/driver.mapper';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

@Injectable()
export class PrismaDriverRepository implements DriverRepository {
  private readonly logger = new Logger(PrismaDriverRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * @param driver - DriverEntity to persist
   * @returns DriverEntity created or null
   */
  async save(driver: DriverEntity): Promise<DriverEntity | null> {
    const data = DriverMapper.toPersistence(driver);
    await this.prismaService.driver.create({ data });
    return driver;
  }

  /**
   * @param id - UUID of the driver
   * @returns DriverEntity or null if not found
   */
  async findById(id: string): Promise<DriverEntity | null> {
    const raw = await this.prismaService.driver.findUnique({ where: { id } });
    return raw ? DriverMapper.toDomain(raw) : null;
  }

  /**
   * @param userId - UUID of the user
   * @returns DriverEntity or null if not found
   */
  async findByUserId(userId: string): Promise<DriverEntity | null> {
    const raw = await this.prismaService.driver.findUnique({
      where: { userId },
    });
    return raw ? DriverMapper.toDomain(raw) : null;
  }

  /**
   * @param cnh - Driver license number
   * @returns DriverEntity or null if not found
   */
  async findByCnh(cnh: string): Promise<DriverEntity | null> {
    const raw = await this.prismaService.driver.findUnique({
      where: { cnh },
    });
    return raw ? DriverMapper.toDomain(raw) : null;
  }

  /**
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with drivers linked to the organization
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Drivers vinculados à org via OrganizationMembership com role=DRIVER
    const [drivers, total] = await this.prismaService.$transaction([
      this.prismaService.driver.findMany({
        where: {
          user: {
            userRoles: {
              some: {
                organizationId,
                removedAt: null,
                role: { name: 'DRIVER' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.driver.count({
        where: {
          user: {
            userRoles: {
              some: {
                organizationId,
                removedAt: null,
                role: { name: 'DRIVER' },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: drivers.map((d) => DriverMapper.toDomain(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * @param driver - DriverEntity with updated data
   * @returns DriverEntity updated or null
   */
  async update(driver: DriverEntity): Promise<DriverEntity | null> {
    const data = DriverMapper.toPersistence(driver);
    await this.prismaService.driver.update({ where: { id: driver.id }, data });
    return driver;
  }

  /**
   * @param id - UUID of the driver to delete
   */
  async delete(id: string): Promise<void> {
    await this.prismaService.driver.delete({ where: { id } });
  }
}
