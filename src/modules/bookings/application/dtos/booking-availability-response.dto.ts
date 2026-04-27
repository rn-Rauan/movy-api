import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from 'src/modules/trip/domain/interfaces';

/**
 * HTTP response shape for the `GET /bookings/availability/:tripInstanceId` endpoint.
 *
 * Allows passengers to check capacity and bookability before attempting to create a booking,
 * avoiding an unnecessary `409 Conflict` response.
 */
export class BookingAvailabilityResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the trip instance',
  })
  tripInstanceId: string;

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
    example: 28,
    description: 'Number of currently active bookings',
  })
  activeCount: number;

  @ApiProperty({
    example: 12,
    description: 'Remaining available slots (totalCapacity - activeCount)',
  })
  availableSlots: number;

  @ApiProperty({
    example: true,
    description:
      'Whether the trip instance is currently open for new bookings (SCHEDULED or CONFIRMED and not full)',
  })
  isBookable: boolean;
}
