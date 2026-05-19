import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
} from 'class-validator';

/**
 * Input DTO for the {@link UpdateOwnDriverUseCase} — `PATCH /drivers/me`.
 *
 * @remarks
 * Self-service updates from the authenticated driver. Only fields the driver
 * is allowed to change about themselves are accepted; `cnh` (license number)
 * and `status` are intentionally absent — those require an admin to change.
 * Both fields are optional. An empty payload is a no-op (returns current state).
 */
export class UpdateOwnDriverDto {
  @ApiPropertyOptional({
    example: '2030-12-31',
    description: 'New CNH expiration date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'CNH expiration date must be a valid ISO date' })
  cnhExpiresAt?: string;

  @ApiPropertyOptional({
    example: ['A', 'B'],
    description:
      'Replacement set of held CNH categories. Drivers may legally hold ' +
      'multiple categories simultaneously (e.g. A + B).',
    isArray: true,
    enum: ['A', 'B', 'C', 'D', 'E'],
    minItems: 1,
    maxItems: 5,
  })
  @IsOptional()
  @IsArray({ message: 'cnhCategories must be an array' })
  @ArrayMinSize(1, { message: 'At least one CNH category is required' })
  @ArrayMaxSize(5, { message: 'At most 5 CNH categories are allowed' })
  @IsIn(['A', 'B', 'C', 'D', 'E'], {
    each: true,
    message: 'Each CNH category must be one of: A, B, C, D, E',
  })
  cnhCategories?: string[];
}
