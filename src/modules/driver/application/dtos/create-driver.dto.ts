import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Input DTO for the {@link CreateDriverUseCase} — `POST /drivers`.
 *
 * @remarks
 * All three CNH fields are required. The CNH number must be 9–12 alphanumeric
 * characters; `cnhCategories` must contain at least one valid category
 * (drivers may legally hold A+B simultaneously); `cnhExpiresAt` must be a
 * future ISO 8601 date string.
 */
export class CreateDriverDto {
  @ApiProperty({
    example: '123456789',
    description: 'Driver license number (CNH)',
    minLength: 9,
    maxLength: 12,
  })
  @IsString({ message: 'CNH must be a string' })
  @MinLength(9, { message: 'CNH must be at least 9 characters' })
  @MaxLength(12, { message: 'CNH must not exceed 12 characters' })
  @IsNotEmpty({ message: 'CNH is required' })
  cnh: string;

  @ApiProperty({
    example: ['A', 'B'],
    description:
      'Held CNH categories. Drivers may hold multiple simultaneously.',
    isArray: true,
    enum: ['A', 'B', 'C', 'D', 'E'],
    minItems: 1,
    maxItems: 5,
  })
  @IsArray({ message: 'cnhCategories must be an array' })
  @ArrayMinSize(1, { message: 'At least one CNH category is required' })
  @ArrayMaxSize(5, { message: 'At most 5 CNH categories are allowed' })
  @IsIn(['A', 'B', 'C', 'D', 'E'], {
    each: true,
    message: 'Each CNH category must be one of: A, B, C, D, E',
  })
  cnhCategories: string[];

  @ApiProperty({
    example: '2028-12-31',
    description: 'CNH expiration date (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'CNH expiration date must be a valid ISO date' })
  @IsNotEmpty({ message: 'CNH expiration date is required' })
  cnhExpiresAt: string;
}
