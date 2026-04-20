import { TripTemplate } from '../../domain/entities';
import { TripTemplateResponseDto } from '../../application/dtos/trip-template-response.dto';

export class TripTemplatePresenter {
  /**
   * Converts a TripTemplate entity to the HTTP response DTO.
   * @param entity - TripTemplate from domain
   * @returns TripTemplateResponseDto formatted for the API
   */
  static toHTTP(entity: TripTemplate): TripTemplateResponseDto {
    return new TripTemplateResponseDto({
      id: entity.id,
      organizationId: entity.organizationId,
      departurePoint: entity.departurePoint,
      destination: entity.destination,
      stops: entity.stops,
      shift: entity.shift,
      frequency: entity.frequency,
      priceOneWay: entity.priceOneWay?.toNumber() ?? null,
      priceReturn: entity.priceReturn?.toNumber() ?? null,
      priceRoundTrip: entity.priceRoundTrip?.toNumber() ?? null,
      isPublic: entity.isPublic,
      isRecurring: entity.isRecurring,
      autoCancelEnabled: entity.autoCancelEnabled,
      minRevenue: entity.minRevenue?.toNumber() ?? null,
      autoCancelOffset: entity.autoCancelOffset,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Converts a list of TripTemplate entities to HTTP response DTOs.
   * @param entities - Array of TripTemplate
   * @returns Array of TripTemplateResponseDto formatted for the API
   */
  static toHTTPList(entities: TripTemplate[]): TripTemplateResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }
}
