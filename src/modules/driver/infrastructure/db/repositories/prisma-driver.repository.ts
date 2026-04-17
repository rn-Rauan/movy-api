import { Injectable } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param driver - DriverEntity to persist
   * @returns DriverEntity created or null
   */
  async save(driver: DriverEntity): Promise<DriverEntity | null> {
    const driverData = await this.prisma.driver.create({
      data: DriverMapper.toPersistence(driver),
    });
    return DriverMapper.toDomain(driverData);
  }

  /**
   * @param id - UUID of the driver
   * @returns DriverEntity or null if not found
   */
  async findById(id: string): Promise<DriverEntity | null> {
    const driverData = await this.prisma.driver.findUnique({ where: { id } });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
  }

  /**
   * @param userId - UUID of the user
   * @returns DriverEntity or null if not found
   */
  async findByUserId(userId: string): Promise<DriverEntity | null> {
    const driverData = await this.prisma.driver.findUnique({
      where: { userId },
    });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
  }

  /**
   * @param cnh - Driver license number
   * @returns DriverEntity or null if not found
   */
  async findByCnh(cnh: string): Promise<DriverEntity | null> {
    const driverData = await this.prisma.driver.findUnique({
      where: { cnh },
    });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
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

    const [drivers, total] = await this.prisma.$transaction([
      this.prisma.driver.findMany({
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
      this.prisma.driver.count({
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
    const driverData = await this.prisma.driver.update({
      where: { id: driver.id },
      data: DriverMapper.toPersistence(driver),
    });
    return DriverMapper.toDomain(driverData);
  }

  /**
   * @param id - UUID of the driver to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.driver.delete({ where: { id } });
  }

  /**
   * @param driverId - UUID of the driver
   * @param organizationId - UUID of the organization
   * @returns true if driver has an active membership in the organization
   */
  async belongsToOrganization(
    driverId: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.driver.count({
      where: {
        id: driverId,
        user: {
          userRoles: {
            some: {
              organizationId,
              removedAt: null,
            },
          },
        },
      },
    });
    return count > 0;
  }
}
