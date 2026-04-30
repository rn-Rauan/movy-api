import type { PublicTripInstanceData } from '../../domain/interfaces/public-trip-query.service';
import { PublicTripInstanceResponseDto } from '../../application/dtos/public-trip-instance-response.dto';

/**
 * Serialises a {@link PublicTripInstanceData} (trip instance + template snapshot)
 * into the {@link PublicTripInstanceResponseDto} HTTP response shape.
 *
 * @remarks
 * All methods are static — this class is a pure mapping utility and is not
 * registered in the NestJS DI container.  It must only be called from the
 * presentation layer ({@link PublicTripInstanceController}).
 */
export class PublicTripInstancePresenter {
  /**
   * Maps a single enriched row to its HTTP response DTO.
   *
   * @param data - A {@link PublicTripInstanceData} combining a {@link TripInstance}
   *   entity with the parent template's route and pricing fields
   * @returns A {@link PublicTripInstanceResponseDto} safe to include in an HTTP response
   */
  static toHTTP(data: PublicTripInstanceData): PublicTripInstanceResponseDto {
    const { instance } = data;
    return {
      id: instance.id,
      organizationId: instance.organizationId,
      tripTemplateId: instance.tripTemplateId,
      tripStatus: instance.tripStatus,
      departureTime: instance.departureTime,
      arrivalEstimate: instance.arrivalEstimate,
      totalCapacity: instance.totalCapacity,
      departurePoint: data.departurePoint,
      destination: data.destination,
      priceOneWay: data.priceOneWay,
      priceReturn: data.priceReturn,
      priceRoundTrip: data.priceRoundTrip,
      isRecurring: data.isRecurring,
    };
  }

  /**
   * Maps a collection of enriched rows to an array of HTTP response DTOs.
   *
   * @param items - Array of {@link PublicTripInstanceData} instances to serialise
   * @returns Array of {@link PublicTripInstanceResponseDto} objects
   */
  static toHTTPList(
    items: PublicTripInstanceData[],
  ): PublicTripInstanceResponseDto[] {
    return items.map((item) => PublicTripInstancePresenter.toHTTP(item));
  }
}
