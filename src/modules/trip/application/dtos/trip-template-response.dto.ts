import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '../../domain/interfaces/enums/day-of-week.enum';
import { Shift } from '../../domain/interfaces/enums/shift.enum';

/**
 * Response DTO with public trip template data.
 */
export class TripTemplateResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Unique identifier of the trip template',
  })
  id: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Organization that owns this trip template',
  })
  organizationId: string;

  @ApiProperty({
    example: 'Terminal Rodoviário',
    description: 'Starting location of the trip',
  })
  departurePoint: string;

  @ApiProperty({
    example: 'Universidade Federal',
    description: 'Final destination of the trip',
  })
  destination: string;

  @ApiProperty({
    example: ['Terminal Rodoviário', 'Praça Central', 'Universidade Federal'],
    description: 'Ordered list of stops',
    type: [String],
  })
  stops: string[];

  @ApiProperty({
    example: 'MORNING',
    description: 'Shift classification',
    enum: Shift,
  })
  shift: Shift;

  @ApiProperty({
    example: '07:30',
    description: 'Departure time-of-day in HH:mm 24-hour UTC format',
    nullable: true,
  })
  departureTimeOfDay: string | null;

  @ApiProperty({
    example: '08:30',
    description: 'Estimated arrival time-of-day in HH:mm 24-hour UTC format',
    nullable: true,
  })
  arrivalTimeOfDay: string | null;

  @ApiProperty({
    example: 20,
    description:
      'Default seat capacity copied into each TripInstance generated from this template.',
    nullable: true,
  })
  defaultCapacity: number | null;

  @ApiPropertyOptional({
    example: '6f9c2c2b-5a9b-4d7a-9c1e-1e2c8a3d4f5a',
    description:
      'Default driver assigned to generated instances. When both this and ' +
      'defaultVehicleId are set, instances are auto-promoted to SCHEDULED.',
    nullable: true,
  })
  defaultDriverId: string | null;

  @ApiPropertyOptional({
    example: '6f9c2c2b-5a9b-4d7a-9c1e-1e2c8a3d4f5a',
    description:
      'Default vehicle assigned to generated instances. When both this and ' +
      'defaultDriverId are set, instances are auto-promoted to SCHEDULED.',
    nullable: true,
  })
  defaultVehicleId: string | null;

  @ApiProperty({
    example: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    description: 'Recurrence days',
    enum: DayOfWeek,
    isArray: true,
  })
  frequency: DayOfWeek[];

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Price for one-way enrollment (BRL)',
    nullable: true,
  })
  priceOneWay: number | null;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Price for return enrollment (BRL)',
    nullable: true,
  })
  priceReturn: number | null;

  @ApiPropertyOptional({
    example: 22.99,
    description: 'Price for round-trip enrollment (BRL)',
    nullable: true,
  })
  priceRoundTrip: number | null;

  @ApiProperty({ example: false, description: 'Visible to all organizations' })
  isPublic: boolean;

  @ApiProperty({ example: true, description: 'Recurs on defined frequency' })
  isRecurring: boolean;

  @ApiProperty({
    example: false,
    description: 'Auto-cancel based on minimum revenue',
  })
  autoCancelEnabled: boolean;

  @ApiPropertyOptional({
    example: 100.99,
    description: 'Minimum revenue threshold (BRL)',
    nullable: true,
  })
  minRevenue: number | null;

  @ApiPropertyOptional({
    example: 60,
    description: 'Minutes before departure to evaluate auto-cancel',
    nullable: true,
  })
  autoCancelOffset: number | null;

  @ApiProperty({ example: 'ACTIVE', description: 'Current template status' })
  status: string;

  @ApiProperty({
    example: '2026-04-17T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-04-17T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  constructor(props: Partial<TripTemplateResponseDto>) {
    Object.assign(this, props);
  }
}
