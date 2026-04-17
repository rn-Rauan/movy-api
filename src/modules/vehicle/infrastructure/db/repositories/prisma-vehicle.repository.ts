import { Injectable } from '@nestjs/common';
import { VehicleEntity } from 'src/modules/vehicle/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { VehicleMapper } from '../mappers/vehicle.mapper';

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param vehicle - VehicleEntity to persist
   * @returns VehicleEntity created or null
   */
  async save(vehicle: VehicleEntity): Promise<VehicleEntity | null> {
    const vehicleData = await this.prisma.vehicle.create({
      data: VehicleMapper.toPersistence(vehicle),
    });
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * @param id - UUID of the vehicle
   * @returns VehicleEntity or null if not found
   */
  async findById(id: string): Promise<VehicleEntity | null> {
    const vehicleData = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicleData) return null;
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * @param plate - Normalized plate string (e.g. "ABC1234")
   * @returns VehicleEntity or null if not found
   */
  async findByPlate(plate: string): Promise<VehicleEntity | null> {
    const vehicleData = await this.prisma.vehicle.findUnique({
      where: { plate },
    });
    if (!vehicleData) return null;
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with VehicleEntity list
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<VehicleEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [vehicles, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where: { organizationId } }),
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
   * @param vehicle - VehicleEntity with updated data
   * @returns VehicleEntity updated or null
   */
  async update(vehicle: VehicleEntity): Promise<VehicleEntity | null> {
    const vehicleData = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: VehicleMapper.toPersistence(vehicle),
    });
    return VehicleMapper.toDomain(vehicleData);
  }

  /**
   * @param id - UUID of the vehicle to delete
   */
  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
