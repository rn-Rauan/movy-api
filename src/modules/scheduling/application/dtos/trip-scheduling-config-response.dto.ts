import { ApiProperty } from '@nestjs/swagger';

/** HTTP response shape for `TripSchedulingConfig`. */
export class TripSchedulingConfigResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  organizationId: string;

  @ApiProperty({ example: 14, description: 'Days ahead the generator scans' })
  daysAhead: number;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: '2026-05-16T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-05-16T10:30:00.000Z' })
  updatedAt: Date;

  constructor(props: Partial<TripSchedulingConfigResponseDto>) {
    Object.assign(this, props);
  }
}
