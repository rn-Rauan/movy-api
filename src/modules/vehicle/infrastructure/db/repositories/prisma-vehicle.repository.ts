import { Injectable } from '@nestjs/common';
import { VehicleEntity } from 'src/modules/vehicle/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { VehicleMapper } from '../mappers/vehicle.mapper';

/**
 * Prisma-backed implementation of {@link VehicleRepository}.
 *
 * All I/O operations target the `vehicle` table via the Prisma Client.
 */
@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new vehicle row via `prisma.vehicle.create`.
   *
   * @param vehicle - The {@link VehicleEntity} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(vehicle: VehicleEntity): Promise<VehicleEntity | null> {
    const vehicleData = await this.db.vehicle.create({
      data: VehicleMapper.toPersistence(vehicle),
    });
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * Finds a vehicle by UUID via `prisma.vehicle.findUnique`.
   *
   * @param id - UUID of the vehicle
   * @returns The matching {@link VehicleEntity}, or `null` if not found
   */
  async findById(id: string): Promise<VehicleEntity | null> {
    const vehicleData = await this.db.vehicle.findUnique({ where: { id } });
    if (!vehicleData) return null;
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * Finds a vehicle by its normalised plate string via `prisma.vehicle.findUnique`.
   *
   * @param plate - Normalised plate string (e.g. `"ABC1234"`)
   * @returns The matching {@link VehicleEntity}, or `null` if not found
   */
  async findByPlate(plate: string): Promise<VehicleEntity | null> {
    const vehicleData = await this.db.vehicle.findUnique({
      where: { plate },
    });
    if (!vehicleData) return null;
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * Returns a paginated list of vehicles for an organisation,
   * ordered by `createdAt` descending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link VehicleEntity} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<VehicleEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      this.db.vehicle.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.vehicle.count({ where: { organizationId } }),
    ]);

    return {
      data: vehicles.map((v) => VehicleMapper.toDomain(v)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates an existing vehicle row via `prisma.vehicle.update`.
   *
   * @param vehicle - The {@link VehicleEntity} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(vehicle: VehicleEntity): Promise<VehicleEntity | null> {
    const vehicleData = await this.db.vehicle.update({
      where: { id: vehicle.id },
      data: VehicleMapper.toPersistence(vehicle),
    });
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * Hard-deletes a vehicle row via `prisma.vehicle.delete`.
   *
   * @param id - UUID of the vehicle to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.vehicle.delete({ where: { id } });
  }

  /**
   * Counts ACTIVE vehicles for an organisation via `prisma.vehicle.count`.
   *
   * @param organizationId - UUID of the organisation
   * @returns Number of active vehicles
   */
  async countActiveByOrganizationId(organizationId: string): Promise<number> {
    return this.db.vehicle.count({
      where: { organizationId, status: 'ACTIVE' },
    });
  }
}
