import { BookingResponseDto } from '../../application/dtos/booking-response.dto';
import { Booking } from '../../domain/entities';

export class BookingPresenter {
  /**
   * Converts a Booking entity to the HTTP response DTO.
   * @param entity - Booking from domain
   * @returns BookingResponseDto formatted for the API
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
    });
  }

  /**
   * Converts a list of Booking entities to HTTP response DTOs.
   * @param entities - Array of Booking
   * @returns Array of BookingResponseDto formatted for the API
   */
  static toHTTPList(entities: Booking[]): BookingResponseDto[] {
    return entities.map((e) => this.toHTTP(e));
  }
}
