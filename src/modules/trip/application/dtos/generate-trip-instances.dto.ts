import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Input DTO for `POST /trip-templates/:id/generate-instances`.
 *
 * All fields are optional. When `daysAhead` is omitted the use case falls
 * back to the organisation's {@link TripSchedulingConfig.daysAhead}, then
 * to the global default of 14.
 */
export class GenerateTripInstancesDto {
  @ApiPropertyOptional({
    example: 14,
    description:
      'Override the rolling-window size in days. Falls back to the org scheduling config when omitted.',
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsInt({ message: 'daysAhead must be an integer' })
  @Min(1, { message: 'daysAhead must be at least 1' })
  @Max(90, { message: 'daysAhead must be at most 90' })
  daysAhead?: number;
}

/**
 * Response DTO returned by the manual generation endpoint.
 *
 * Mirrors the cron sweep result, scoped to a single template:
 * - `created`: TripInstance rows actually inserted
 * - `skipped`: days skipped (frequency mismatch, past, idempotent, or
 *              unique-constraint race with a parallel writer)
 * - `failed`: per-day failures during save (logged, not aborted)
 */
export class GenerateTripInstancesResponseDto {
  @ApiProperty({
    example: 6,
    description: 'Number of TripInstances inserted by this run.',
  })
  created: number;

  @ApiProperty({
    example: 8,
    description:
      'Days skipped — already had an instance, fell outside the template frequency, or had a past departure.',
  })
  skipped: number;

  @ApiProperty({
    example: 0,
    description:
      'Days where save failed (logged server-side; sweep does not abort on per-day failure).',
  })
  failed: number;

  constructor(props: Partial<GenerateTripInstancesResponseDto>) {
    Object.assign(this, props);
  }
}
