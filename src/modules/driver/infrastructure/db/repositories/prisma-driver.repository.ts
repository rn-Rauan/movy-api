import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { DriverRepository } from '../../../domain/interfaces';
import { DriverEntity } from '../../../domain/entities/driver.entity';
import { DriverMapper } from '../mappers/driver.mapper';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Prisma-backed implementation of {@link DriverRepository}.
 *
 * All I/O operations target the `driver` table via the Prisma Client.
 * `findByOrganizationId` and `belongsToOrganization` join through the
 * `userRoles` relation to enforce organization scoping.
 */
@Injectable()
export class PrismaDriverRepository implements DriverRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new driver row via `prisma.driver.create`.
   *
   * @param driver - The {@link DriverEntity} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(driver: DriverEntity): Promise<DriverEntity | null> {
    const driverData = await this.db.driver.create({
      data: DriverMapper.toPersistence(driver),
    });
    return DriverMapper.toDomain(driverData);
  }

  /**
   * Finds a driver by UUID via `prisma.driver.findUnique`.
   *
   * @param id - UUID of the driver
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  async findById(id: string): Promise<DriverEntity | null> {
    const driverData = await this.db.driver.findUnique({ where: { id } });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
  }

  /**
   * Finds a driver by the associated user UUID via `prisma.driver.findUnique`.
   *
   * @param userId - UUID of the user
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  async findByUserId(userId: string): Promise<DriverEntity | null> {
    const driverData = await this.db.driver.findUnique({
      where: { userId },
    });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
  }

  /**
   * Finds a driver by CNH number via `prisma.driver.findUnique`.
   *
   * @param cnh - Driver license number string
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  async findByCnh(cnh: string): Promise<DriverEntity | null> {
    const driverData = await this.db.driver.findUnique({
      where: { cnh },
    });
    if (!driverData) return null;
    return DriverMapper.toDomain(driverData);
  }

  /**
   * Returns a paginated list of drivers linked to the given organization
   * via an active `DRIVER` role membership.
   *
   * @param organizationId - UUID of the organization
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link DriverEntity} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [drivers, total] = await Promise.all([
      this.db.driver.findMany({
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
      this.db.driver.count({
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
   * Updates an existing driver row via `prisma.driver.update`.
   *
   * @param driver - The {@link DriverEntity} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(driver: DriverEntity): Promise<DriverEntity | null> {
    const driverData = await this.db.driver.update({
      where: { id: driver.id },
      data: DriverMapper.toPersistence(driver),
    });
    return DriverMapper.toDomain(driverData);
  }

  /**
   * Hard-deletes a driver row via `prisma.driver.delete`.
   *
   * @param id - UUID of the driver to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.driver.delete({ where: { id } });
  }

  /**
   * Queries whether a driver holds an active membership in the given organization
   * via the `userRoles` join table.
   *
   * @param driverId - UUID of the driver
   * @param organizationId - UUID of the organization
   * @returns `true` if the driver has an active role in that organization
   */
  async belongsToOrganization(
    driverId: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.db.driver.count({
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
