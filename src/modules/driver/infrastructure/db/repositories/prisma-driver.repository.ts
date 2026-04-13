import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { DriverRepository } from '../../../domain/interfaces';
import { DriverEntity } from '../../../domain/entities/driver.entity';
import { DriverMapper } from '../mappers/driver.mapper';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';

@Injectable()
export class PrismaDriverRepository implements DriverRepository {
  private readonly logger = new Logger(PrismaDriverRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  async save(driver: DriverEntity): Promise<DriverEntity | null> {
    const data = DriverMapper.toPersistence(driver);
    await this.prismaService.driver.create({
      data: data,
    });
    return driver;
  }

  async findById(id: string): Promise<DriverEntity | null> {
    const raw = await this.prismaService.driver.findUnique({
      where: { id },
    });

    return raw ? DriverMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: string): Promise<DriverEntity | null> {
    const raw = await this.prismaService.driver.findUnique({
      where: { userId },
    });

    return raw ? DriverMapper.toDomain(raw) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [drivers, total] = await this.prismaService.$transaction([
      this.prismaService.driver.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      this.prismaService.driver.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: drivers.map((driver) => DriverMapper.toDomain(driver)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(driver: DriverEntity): Promise<DriverEntity | null> {
    const data = DriverMapper.toPersistence(driver);
    await this.prismaService.driver.update({
      where: { id: driver.id },
      data: data,
    });
    return driver;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.driver.delete({
      where: { id },
    }); 
  }
}
