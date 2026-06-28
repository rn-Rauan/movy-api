import { BookingListItemResponseDto } from '../../application/dtos/booking-list-item-response.dto';
import { BookingResponseDto } from '../../application/dtos/booking-response.dto';
import { Booking } from '../../domain/entities';
import { BookingWithTripMeta } from '../../domain/interfaces';

/**
 * Serialises a {@link Booking} domain object into the HTTP response shape {@link BookingResponseDto}.
 *
 * Responsible for unwrapping the {@link Money} Value Object into a plain `number`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class BookingPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param entity - The {@link Booking} to serialise
   * @returns A {@link BookingResponseDto} safe to include in an HTTP response
   */
  static toHTTP(entity: Booking): BookingResponseDto {
    return new BookingResponseDto({
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      tripInstanceId: entity.tripInstanceId,
      enrollmentDate: entity.enrollmentDate,
      status: entity.status,
      presenceConfirmed: entity.presenceConfirmed,
      enrollmentType: entity.enrollmentType,
      recordedPrice: entity.recordedPrice.toNumber(),
      boardingStop: entity.boardingStop,
      alightingStop: entity.alightingStop,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      paymentMethod: entity.paymentMethod ?? null,
    });
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param entities - Array of {@link Booking} instances to serialise
   * @returns Array of {@link BookingResponseDto} objects
   */
  static toHTTPList(entities: Booking[]): BookingResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }

  /**
   * Maps a {@link BookingWithTripMeta} (booking + trip status/departure) to the
   * enriched list-item DTO used by `GET /bookings/user`.
   *
   * @param meta - Booking enriched with its parent trip instance's status and departure time
   * @returns A {@link BookingListItemResponseDto} safe to include in an HTTP response
   */
  static toListItemHTTP(meta: BookingWithTripMeta): BookingListItemResponseDto {
    const base = this.toHTTP(meta.booking);
    return Object.assign(new BookingListItemResponseDto(base), {
      tripStatus: meta.tripStatus,
      tripDepartureTime: meta.tripDepartureTime,
    });
  }

  /**
   * Maps a collection of {@link BookingWithTripMeta} to enriched list-item DTOs.
   *
   * @param metas - Array of bookings enriched with trip status/departure time
   * @returns Array of {@link BookingListItemResponseDto} objects
   */
  static toListItemHTTPList(
    metas: BookingWithTripMeta[],
  ): BookingListItemResponseDto[] {
    return metas.map((m) => this.toListItemHTTP(m));
  }
}
