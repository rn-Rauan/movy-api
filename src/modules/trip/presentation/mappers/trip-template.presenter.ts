import { TripTemplate } from '../../domain/entities';
import { TripTemplateResponseDto } from '../../application/dtos/trip-template-response.dto';

/**
 * Serialises a {@link TripTemplate} domain object into the HTTP response shape {@link TripTemplateResponseDto}.
 *
 * Responsible for unwrapping {@link Money} Value Objects into plain `number` values.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class TripTemplatePresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param entity - The {@link TripTemplate} to serialise
   * @returns A {@link TripTemplateResponseDto} safe to include in an HTTP response
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
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link TripTemplate} instances to serialise
   * @returns Array of {@link TripTemplateResponseDto} objects
   */
  static toHTTPList(entities: TripTemplate[]): TripTemplateResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }
}
