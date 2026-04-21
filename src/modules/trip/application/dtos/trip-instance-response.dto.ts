import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripStatus } from '../../domain/interfaces';

/**
 * Response DTO with public trip instance data.
 */
export class TripInstanceResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Unique identifier of the trip instance',
  })
  id: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Organization that owns this trip instance',
  })
  organizationId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Trip template this instance was created from',
  })
  tripTemplateId: string;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Assigned driver UUID, or null if not yet assigned',
    nullable: true,
  })
  driverId: string | null;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Assigned vehicle UUID, or null if not yet assigned',
    nullable: true,
  })
  vehicleId: string | null;

  @ApiProperty({
    example: TripStatus.DRAFT,
    description: 'Current lifecycle status of the trip instance',
    enum: TripStatus,
  })
  tripStatus: TripStatus;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Minimum revenue threshold for auto-cancel evaluation (BRL)',
    nullable: true,
  })
  minRevenue: number | null;

  @ApiPropertyOptional({
    example: '2026-05-10T06:30:00.000Z',
    description:
      'Timestamp at which auto-cancel is evaluated (before departure)',
    nullable: true,
  })
  autoCancelAt: Date | null;

  @ApiProperty({
    example: false,
    description:
      'Whether the admin forced confirmation bypassing revenue checks',
  })
  forceConfirm: boolean;

  @ApiProperty({
    example: 40,
    description: 'Snapshot of vehicle seat capacity at scheduling time',
  })
  totalCapacity: number;

  @ApiProperty({
    example: '2026-05-10T07:30:00.000Z',
    description: 'Scheduled departure date and time',
  })
  departureTime: Date;

  @ApiProperty({
    example: '2026-05-10T08:15:00.000Z',
    description: 'Estimated arrival date and time',
  })
  arrivalEstimate: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
