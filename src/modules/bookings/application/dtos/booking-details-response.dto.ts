import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from 'src/modules/trip/domain/interfaces';
import { BookingResponseDto } from './booking-response.dto';

/**
 * Extended response DTO that includes trip instance data alongside booking info.
 * Used by GET /bookings/:id/details to avoid a second round-trip from the client.
 */
export class BookingDetailsResponseDto extends BookingResponseDto {
  @ApiProperty({
    example: '2026-06-15T07:30:00.000Z',
    description: 'Scheduled departure time of the trip instance',
  })
  tripDepartureTime: Date;

  @ApiProperty({
    example: '2026-06-15T09:00:00.000Z',
    description: 'Estimated arrival time of the trip instance',
  })
  tripArrivalEstimate: Date;

  @ApiProperty({
    example: TripStatus.SCHEDULED,
    description: 'Current status of the trip instance',
    enum: TripStatus,
  })
  tripStatus: TripStatus;

  @ApiProperty({
    example: 40,
    description: 'Total passenger capacity of the vehicle',
  })
  totalCapacity: number;

  @ApiProperty({
    example: 12,
    description: 'Remaining available slots in the trip instance',
  })
  availableSlots: number;
}
