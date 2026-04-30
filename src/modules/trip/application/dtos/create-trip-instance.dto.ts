import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';
import { TripStatus } from '../../domain/interfaces';

export class CreateTripInstanceDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the trip template this instance is based on',
  })
  @IsUUID('4', { message: 'tripTemplateId must be a valid UUID' })
  @IsNotEmpty({ message: 'tripTemplateId is required' })
  tripTemplateId: string;

  @ApiProperty({
    example: '2026-05-10T07:30:00.000Z',
    description: 'Scheduled departure date and time (ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'departureTime must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty({ message: 'departureTime is required' })
  departureTime: string;

  @ApiProperty({
    example: '2026-05-10T08:15:00.000Z',
    description:
      'Estimated arrival date and time (ISO 8601) — must be after departureTime',
  })
  @IsDateString(
    {},
    { message: 'arrivalEstimate must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty({ message: 'arrivalEstimate is required' })
  arrivalEstimate: string;

  @ApiProperty({
    example: 40,
    description:
      'Snapshot of the vehicle total seat capacity at scheduling time',
  })
  @IsInt({ message: 'totalCapacity must be an integer' })
  @IsPositive({ message: 'totalCapacity must be positive' })
  totalCapacity: number;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the assigned driver',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'driverId must be a valid UUID' })
  driverId?: string | null;

  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the assigned vehicle',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'vehicleId must be a valid UUID' })
  vehicleId?: string | null;

  @ApiPropertyOptional({
    example: 150.0,
    description:
      'Override for minimum revenue threshold (BRL). Defaults to template value if autoCancelEnabled.',
    nullable: true,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minRevenue must be a number' })
  @Min(0, { message: 'minRevenue must be >= 0' })
  minRevenue?: number | null;

  @ApiPropertyOptional({
    example: TripStatus.SCHEDULED,
    description:
      'Initial status after creation. Use SCHEDULED to publish the trip immediately ' +
      '(requires driverId and vehicleId). Defaults to DRAFT.',
    enum: [TripStatus.DRAFT, TripStatus.SCHEDULED],
    default: TripStatus.DRAFT,
  })
  @IsOptional()
  @IsIn([TripStatus.DRAFT, TripStatus.SCHEDULED], {
    message: `initialStatus must be one of: ${TripStatus.DRAFT}, ${TripStatus.SCHEDULED}`,
  })
  initialStatus?: TripStatus.DRAFT | TripStatus.SCHEDULED;
}
