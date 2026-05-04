import { TripInstance } from '../../domain/entities';
import { TripInstanceWithMeta } from '../../domain/interfaces';
import { TripInstanceResponseDto } from '../../application/dtos/trip-instance-response.dto';

/**
 * Serialises a {@link TripInstance} domain object into the HTTP response shape {@link TripInstanceResponseDto}.
 *
 * Responsible for unwrapping the `minRevenue` {@link Money} Value Object into a plain `number`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class TripInstancePresenter {
  /**
   * Maps a single entity to its HTTP response DTO (without occupancy/template metadata).
   * Used by endpoints that return a single instance (create, findById, findByTemplate).
   *
   * @param entity - The {@link TripInstance} to serialise
   * @returns A {@link TripInstanceResponseDto} safe to include in an HTTP response
   */
  static toHTTP(entity: TripInstance): TripInstanceResponseDto {
    return new TripInstanceResponseDto({
      id: entity.id,
      organizationId: entity.organizationId,
      tripTemplateId: entity.tripTemplateId,
      driverId: entity.driverId,
      vehicleId: entity.vehicleId,
      tripStatus: entity.tripStatus,
      minRevenue: entity.minRevenue?.toNumber() ?? null,
      autoCancelAt: entity.autoCancelAt,
      forceConfirm: entity.forceConfirm,
      totalCapacity: entity.totalCapacity,
      bookedCount: 0,
      availableSlots: entity.totalCapacity,
      departureTime: entity.departureTime,
      arrivalEstimate: entity.arrivalEstimate,
      departurePoint: '',
      destination: '',
      priceOneWay: null,
      priceReturn: null,
      priceRoundTrip: null,
      isRecurring: false,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Maps an enriched data bag (instance + booking counts + template fields) to its HTTP response DTO.
   * Used by the org-scoped list endpoint.
   *
   * @param data - The {@link TripInstanceWithMeta} to serialise
   * @returns A {@link TripInstanceResponseDto} with all fields populated
   */
  static toHTTPWithMeta(data: TripInstanceWithMeta): TripInstanceResponseDto {
    const { instance, bookedCount } = data;
    return new TripInstanceResponseDto({
      id: instance.id,
      organizationId: instance.organizationId,
      tripTemplateId: instance.tripTemplateId,
      driverId: instance.driverId,
      vehicleId: instance.vehicleId,
      tripStatus: instance.tripStatus,
      minRevenue: instance.minRevenue?.toNumber() ?? null,
      autoCancelAt: instance.autoCancelAt,
      forceConfirm: instance.forceConfirm,
      totalCapacity: instance.totalCapacity,
      bookedCount,
      availableSlots: Math.max(0, instance.totalCapacity - bookedCount),
      departureTime: instance.departureTime,
      arrivalEstimate: instance.arrivalEstimate,
      departurePoint: data.departurePoint,
      destination: data.destination,
      priceOneWay: data.priceOneWay,
      priceReturn: data.priceReturn,
      priceRoundTrip: data.priceRoundTrip,
      isRecurring: data.isRecurring,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    });
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link TripInstance} instances to serialise
   * @returns Array of {@link TripInstanceResponseDto} objects
   */
  static toHTTPList(entities: TripInstance[]): TripInstanceResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }

  /**
   * Maps a collection of enriched data bags to an array of HTTP response DTOs.
   *
   * @param items - Array of {@link TripInstanceWithMeta} items to serialise
   * @returns Array of {@link TripInstanceResponseDto} objects
   */
  static toHTTPListWithMeta(
    items: TripInstanceWithMeta[],
  ): TripInstanceResponseDto[] {
    return items.map((item) => this.toHTTPWithMeta(item));
  }
}
