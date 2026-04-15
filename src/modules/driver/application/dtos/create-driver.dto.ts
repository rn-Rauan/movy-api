import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
