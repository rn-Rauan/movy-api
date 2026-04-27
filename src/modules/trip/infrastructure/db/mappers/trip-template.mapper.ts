import { TripTemplate as PrismaTripTemplate } from 'generated/prisma/client';
import { TripTemplate } from 'src/modules/trip/domain/entities';
import { DayOfWeek, Shift } from 'src/modules/trip/domain/interfaces';
import { Money, type Status } from 'src/shared';

/**
 * Bidirectional mapper between the Prisma `TripTemplate` model and the {@link TripTemplate} domain object.
 *
 * Handles price fields by casting `Prisma.Decimal` to `number` via `Number()` and
 * reconstructing the {@link Money} Value Object via `Money.restore()`. Contains no business logic.
 */
export class TripTemplateMapper {
  /**
   * Converts a raw Prisma `TripTemplate` record to a {@link TripTemplate} domain object.
   *
   * @param raw - Raw `TripTemplate` record returned by the Prisma client
   * @returns A fully hydrated {@link TripTemplate} instance
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
      priceReturn: raw.priceReturn
        ? Money.restore(Number(raw.priceReturn))
        : null,
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
   * Converts a {@link TripTemplate} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param entity - The {@link TripTemplate} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.tripTemplate.create({ data })`
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
