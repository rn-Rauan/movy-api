import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The ID of the user',
  })
  @IsUUID(undefined, { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The ID of the organization',
  })
  @IsUUID(undefined, { message: 'Organization ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;

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
    example: 'B',
    description: 'Driver license category (A, B, C, D, E)',
    enum: ['A', 'B', 'C', 'D', 'E'],
  })
  @IsString({ message: 'CNH category must be a string' })
  @IsIn(['A', 'B', 'C', 'D', 'E'], {
    message: 'CNH category must be one of: A, B, C, D, E',
  })
  @IsNotEmpty({ message: 'CNH category is required' })
  cnhCategory: string;

  @ApiProperty({
    example: '2028-12-31',
    description: 'CNH expiration date (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'CNH expiration date must be a valid ISO date' })
  @IsNotEmpty({ message: 'CNH expiration date is required' })
  cnhExpiresAt: string;
}
