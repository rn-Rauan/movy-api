import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { BookingResponseDto } from './booking-response.dto';

/**
 * HTTP response shape for each item of the user's bookings listing (`GET /bookings/user`).
 *
 * Extends {@link BookingResponseDto} with the parent trip instance's lifecycle status
 * and departure time so the client can render finished trips as read-only history and
 * display the real departure time — without an extra round-trip per booking.
 */
export class BookingListItemResponseDto extends BookingResponseDto {
  @ApiProperty({
    example: TripStatus.SCHEDULED,
    enum: TripStatus,
    description:
      'Current lifecycle status of the trip instance this booking belongs to',
  })
  tripStatus: TripStatus;

  @ApiProperty({
    example: '2026-06-15T07:30:00.000Z',
    description: 'Scheduled departure time of the trip instance',
  })
  tripDepartureTime: Date;
}
