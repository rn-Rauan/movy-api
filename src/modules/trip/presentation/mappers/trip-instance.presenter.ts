import { TripInstance } from '../../domain/entities';
import { TripInstanceResponseDto } from '../../application/dtos/trip-instance-response.dto';

export class TripInstancePresenter {
  /**
   * Converts a TripInstance entity to the HTTP response DTO.
   * @param entity - TripInstance from domain
   * @returns TripInstanceResponseDto formatted for the API
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
   * Converts a list of TripInstance entities to HTTP response DTOs.
   * @param entities - Array of TripInstance
   * @returns Array of TripInstanceResponseDto formatted for the API
   */
  static toHTTPList(entities: TripInstance[]): TripInstanceResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }
}
