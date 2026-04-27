import { TripInstance } from '../../domain/entities';
import { TripInstanceResponseDto } from '../../application/dtos/trip-instance-response.dto';

/**
 * Serialises a {@link TripInstance} domain object into the HTTP response shape {@link TripInstanceResponseDto}.
 *
 * Responsible for unwrapping the `minRevenue` {@link Money} Value Object into a plain `number`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class TripInstancePresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
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
      departureTime: entity.departureTime,
      arrivalEstimate: entity.arrivalEstimate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
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
}
