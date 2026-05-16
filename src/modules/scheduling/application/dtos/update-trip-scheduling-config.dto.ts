import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Patch DTO for `PATCH /organizations/:organizationId/scheduling-config`.
 *
 * All fields are optional; any provided value replaces the stored one.
 * Cron expression validity is enforced by the domain entity at apply time.
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
    example: '0 2 * * *',
    description: 'Cron expression for the trip generation job',
  })
  @IsOptional()
  @IsString({ message: 'generationCron must be a string' })
  generationCron?: string;

  @ApiPropertyOptional({
    example: '*/15 * * * *',
    description: 'Cron expression for the auto-cancel job',
  })
  @IsOptional()
  @IsString({ message: 'autoCancelCron must be a string' })
  autoCancelCron?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether generation/auto-cancel jobs run for this organisation',
  })
  @IsOptional()
  @IsBoolean({ message: 'enabled must be a boolean' })
  enabled?: boolean;
}
