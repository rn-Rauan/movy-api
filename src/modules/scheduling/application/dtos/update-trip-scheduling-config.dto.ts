import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Patch DTO for `PATCH /organizations/:organizationId/scheduling-config`.
 *
 * All fields are optional; any provided value replaces the stored one.
 */
export class UpdateTripSchedulingConfigDto {
  @ApiPropertyOptional({
    example: 14,
    description: 'Days ahead to generate trip instances (1..90)',
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsInt({ message: 'daysAhead must be an integer' })
  @Min(1, { message: 'daysAhead must be >= 1' })
  @Max(90, { message: 'daysAhead must be <= 90' })
  daysAhead?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether generation/auto-cancel jobs run for this organisation',
  })
  @IsOptional()
  @IsBoolean({ message: 'enabled must be a boolean' })
  enabled?: boolean;
}
