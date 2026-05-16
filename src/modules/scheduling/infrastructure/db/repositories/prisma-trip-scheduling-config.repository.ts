import { Injectable } from '@nestjs/common';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { TripSchedulingConfig } from '../../../domain/entities/trip-scheduling-config.entity';
import { TripSchedulingConfigRepository } from '../../../domain/interfaces/trip-scheduling-config.repository';
import { TripSchedulingConfigMapper } from '../mappers/trip-scheduling-config.mapper';

/**
 * Prisma-backed implementation of {@link TripSchedulingConfigRepository}.
 * Reads/writes the `trip_scheduling_config` table via the active DB client
 * (transaction-scoped when one is open).
 */
@Injectable()
export class PrismaTripSchedulingConfigRepository implements TripSchedulingConfigRepository {
  constructor(private readonly dbContext: DbContext) {}

  private get db() {
    return this.dbContext.client;
  }

  async save(config: TripSchedulingConfig): Promise<TripSchedulingConfig> {
    const row = await this.db.tripSchedulingConfig.create({
      data: TripSchedulingConfigMapper.toPersistence(config),
    });
    return TripSchedulingConfigMapper.toDomain(row);
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<TripSchedulingConfig | null> {
    const row = await this.db.tripSchedulingConfig.findUnique({
      where: { organizationId },
    });
    return row ? TripSchedulingConfigMapper.toDomain(row) : null;
  }

  async update(
    config: TripSchedulingConfig,
  ): Promise<TripSchedulingConfig | null> {
    const row = await this.db.tripSchedulingConfig.update({
      where: { id: config.id },
      data: TripSchedulingConfigMapper.toPersistence(config),
    });
    return TripSchedulingConfigMapper.toDomain(row);
  }
}
