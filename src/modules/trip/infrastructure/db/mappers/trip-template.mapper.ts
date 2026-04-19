import { TripTemplate as PrismaTripTemplate } from 'generated/prisma/client';
import { TripTemplate } from 'src/modules/trip/domain/entities';
import { DayOfWeek, Shift } from 'src/modules/trip/domain/interfaces';
import { Money, type Status } from 'src/shared';

/**
 * TripTemplateMapper
 *
 * Responsibility:
 * - Map between Prisma TripTemplate (persistence) and TripTemplate (domain)
 * - Hydrate Money value objects from raw database values
 * - Convert domain entity to persistence format
 */
export class TripTemplateMapper {
  /**
   * Map a raw Prisma TripTemplate row to a TripTemplate domain object.
   * @param raw - PrismaTripTemplate row from database
   * @returns Hydrated TripTemplate
   */
  static toDomain(raw: PrismaTripTemplate): TripTemplate {
    return TripTemplate.restore({
      id: raw.id,
      organizationId: raw.organizationId,
      departurePoint: raw.departurePoint,
      destination: raw.destination,
      frequency: raw.frequency as DayOfWeek[],
      stops: raw.stops,
      priceOneWay: raw.priceOneWay
        ? Money.restore(Number(raw.priceOneWay))
        : null,
      priceReturn: raw.priceReturn ? Money.restore(Number(raw.priceReturn)) : null,
      priceRoundTrip: raw.priceRoundTrip
        ? Money.restore(Number(raw.priceRoundTrip))
        : null,
      isPublic: raw.isPublic,
      isRecurring: raw.isRecurring,
      autoCancelEnabled: raw.autoCancelEnabled,
      minRevenue: raw.minRevenue ? Money.restore(Number(raw.minRevenue)) : null,
      autoCancelOffset: raw.autoCancelOffset,
      status: raw.status as Status,
      shift: raw.shift as Shift,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map a TripTemplate domain object to a plain object suitable for Prisma persistence.
   * @param entity - TripTemplate domain object
   * @returns Prisma-compatible persistence payload
   */
  static toPersistence(entity: TripTemplate) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      departurePoint: entity.departurePoint,
      destination: entity.destination,
      frequency: entity.frequency,
      stops: entity.stops,
      priceOneWay: entity.priceOneWay?.toNumber() ?? null,
      priceReturn: entity.priceReturn?.toNumber() ?? null,
      priceRoundTrip: entity.priceRoundTrip?.toNumber() ?? null,
      isPublic: entity.isPublic,
      isRecurring: entity.isRecurring,
      autoCancelEnabled: entity.autoCancelEnabled,
      minRevenue: entity.minRevenue?.toNumber() ?? null,
      autoCancelOffset: entity.autoCancelOffset,
      status: entity.status,
      shift: entity.shift,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
