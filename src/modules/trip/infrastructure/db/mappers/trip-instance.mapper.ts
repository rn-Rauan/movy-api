import { TripInstance as PrismaTripInstance } from 'generated/prisma/client';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { Money } from 'src/shared';

/**
 * TripInstanceMapper
 *
 * Responsibility:
 * - Map between Prisma TripInstance (persistence) and TripInstance (domain)
 * - Hydrate Money value objects from raw database Decimal values
 * - Convert domain entity to persistence format
 */
export class TripInstanceMapper {
  /**
   * Map a raw Prisma TripInstance row to a TripInstance domain object.
   * @param raw - PrismaTripInstance row from database
   * @returns Hydrated TripInstance domain entity
   */
  static toDomain(raw: PrismaTripInstance): TripInstance {
    return TripInstance.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      tripTemplateId: raw.tripTemplateId,
      driverId: raw.driverId ?? null,
      vehicleId: raw.vehicleId ?? null,
      tripStatus: raw.tripStatus as TripStatus,
      minRevenue: raw.minRevenue ? Money.restore(Number(raw.minRevenue)) : null,
      autoCancelAt: raw.autoCancelAt ?? null,
      forceConfirm: raw.forceConfirm,
      totalCapacity: raw.totalCapacity,
      departureTime: raw.departureTime,
      arrivalEstimate: raw.arrivalEstimate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map a TripInstance domain object to a plain object suitable for Prisma persistence.
   * @param entity - TripInstance domain object
   * @returns Prisma-compatible persistence payload
   */
  static toPersistence(entity: TripInstance) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      tripTemplateId: entity.tripTemplateId,
      driverId: entity.driverId ?? null,
      vehicleId: entity.vehicleId ?? null,
      tripStatus: entity.tripStatus,
      minRevenue: entity.minRevenue?.toNumber() ?? null,
      autoCancelAt: entity.autoCancelAt ?? null,
      forceConfirm: entity.forceConfirm,
      totalCapacity: entity.totalCapacity,
      departureTime: entity.departureTime,
      arrivalEstimate: entity.arrivalEstimate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
