import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Input DTO for the {@link UpdateDriverUseCase} — `PUT /drivers/:id` (ADMIN only).
 *
 * @remarks
 * All fields are optional but CNH fields (`cnh`, `cnhCategories`,
 * `cnhExpiresAt`) must be provided together — partial CNH updates throw
 * {@link PartialCnhUpdateError}. For driver self-service updates of
 * `cnhExpiresAt` / `cnhCategories`, use `PATCH /drivers/me`.
 */
export class UpdateDriverDto {
  @ApiPropertyOptional({
    example: '123456789',
    description: 'Driver license number (CNH)',
    minLength: 9,
    maxLength: 12,
  })
  @IsOptional()
  @IsString({ message: 'CNH must be a string' })
  @MinLength(9, { message: 'CNH must be at least 9 characters' })
  @MaxLength(12, { message: 'CNH must not exceed 12 characters' })
  cnh?: string;

  @ApiPropertyOptional({
    example: ['A', 'B'],
    description: 'Held CNH categories (drivers may hold multiple).',
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

  @ApiPropertyOptional({
    example: '2028-12-31',
    description: 'CNH expiration date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'CNH expiration date must be a valid ISO date' })
  cnhExpiresAt?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Driver status',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED',
  })
  status?: string;
}
