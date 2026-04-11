import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
    example: 'B',
    description: 'Driver license category (A, B, C, D, E)',
    enum: ['A', 'B', 'C', 'D', 'E'],
  })
  @IsOptional()
  @IsString({ message: 'CNH category must be a string' })
  @IsIn(['A', 'B', 'C', 'D', 'E'], {
    message: 'CNH category must be one of: A, B, C, D, E',
  })
  cnhCategory?: string;

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
