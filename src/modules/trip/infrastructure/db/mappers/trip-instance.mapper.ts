import { TripInstance as PrismaTripInstance } from 'generated/prisma/client';
import { TripInstance } from 'src/modules/trip/domain/entities';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { Money } from 'src/shared';

/**
 * Bidirectional mapper between the Prisma `TripInstance` model and the {@link TripInstance} domain object.
 *
 * Handles `minRevenue` by casting `Prisma.Decimal` to `number` via `Number()` and
 * reconstructing the {@link Money} Value Object via `Money.restore()`. Contains no business logic.
 */
export class TripInstanceMapper {
  /**
   * Converts a raw Prisma `TripInstance` record to a {@link TripInstance} domain object.
   *
   * @param raw - Raw `TripInstance` record returned by the Prisma client
   * @returns A fully hydrated {@link TripInstance} instance
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
      isPublic: raw.isPublic,
      departureTime: raw.departureTime,
      arrivalEstimate: raw.arrivalEstimate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link TripInstance} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param entity - The {@link TripInstance} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.tripInstance.create({ data })`
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
      isPublic: entity.isPublic,
      departureTime: entity.departureTime,
      arrivalEstimate: entity.arrivalEstimate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
