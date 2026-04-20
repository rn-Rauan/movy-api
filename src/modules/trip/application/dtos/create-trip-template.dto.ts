import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DayOfWeek } from '../../domain/interfaces/enums/day-of-week.enum';
import { Shift } from '../../domain/interfaces/enums/shift.enum';

/**
 * DTO for creating a new trip template.
 * @param departurePoint - Starting location of the trip
 * @param destination - Final destination of the trip
 * @param stops - Ordered list of intermediate stops (min 2)
 * @param shift - Time-of-day classification (MORNING, AFTERNOON, EVENING)
 * @param frequency - Days of the week when the trip recurs
 */
export class CreateTripTemplateDto {
  @ApiProperty({
    example: 'Terminal Rodoviário',
    description: 'Starting location of the trip',
    maxLength: 255,
  })
  @IsString({ message: 'departurePoint must be a string' })
  @IsNotEmpty({ message: 'departurePoint is required' })
  @MaxLength(255, { message: 'departurePoint must not exceed 255 characters' })
  departurePoint: string;

  @ApiProperty({
    example: 'Universidade Federal',
    description: 'Final destination of the trip',
    maxLength: 255,
  })
  @IsString({ message: 'destination must be a string' })
  @IsNotEmpty({ message: 'destination is required' })
  @MaxLength(255, { message: 'destination must not exceed 255 characters' })
  destination: string;

  @ApiProperty({
    example: ['Terminal Rodoviário', 'Praça Central', 'Universidade Federal'],
    description: 'Ordered list of stops (min 2)',
    type: [String],
  })
  @IsArray({ message: 'stops must be an array' })
  @ArrayMinSize(2, { message: 'stops must contain at least 2 items' })
  @IsString({ each: true, message: 'Each stop must be a string' })
  stops: string[];

  @ApiProperty({
    example: 'MORNING',
    description: 'Shift classification for the trip',
    enum: Shift,
  })
  @IsEnum(Shift, {
    message: 'shift must be one of: MORNING, AFTERNOON, EVENING',
  })
  @IsNotEmpty({ message: 'shift is required' })
  shift: Shift;

  @ApiProperty({
    example: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    description: 'Days of the week when the trip recurs',
    enum: DayOfWeek,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'frequency must be an array' })
  @IsEnum(DayOfWeek, {
    each: true,
    message: 'Each frequency day must be a valid DayOfWeek',
  })
  frequency?: DayOfWeek[];

  @ApiProperty({
    example: 12.5,
    description: 'Price for one-way enrollment (BRL)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceOneWay must be a number' })
  @Min(0, { message: 'priceOneWay must be >= 0' })
  priceOneWay?: number;

  @ApiProperty({
    example: 12.5,
    description: 'Price for return enrollment (BRL)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceReturn must be a number' })
  @Min(0, { message: 'priceReturn must be >= 0' })
  priceReturn?: number;

  @ApiProperty({
    example: 20,
    description: 'Price for round-trip enrollment (BRL)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceRoundTrip must be a number' })
  @Min(0, { message: 'priceRoundTrip must be >= 0' })
  priceRoundTrip?: number;

  @ApiProperty({
    example: false,
    description: 'Whether the trip is visible to all organizations',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean' })
  isPublic?: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the trip recurs on the defined frequency',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isRecurring must be a boolean' })
  isRecurring?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether auto-cancel based on minimum revenue is enabled',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'autoCancelEnabled must be a boolean' })
  autoCancelEnabled?: boolean;

  @ApiProperty({
    example: 100,
    description:
      'Minimum revenue threshold for auto-cancel (BRL). Required when autoCancelEnabled is true.',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minRevenue must be a number' })
  @Min(0, { message: 'minRevenue must be >= 0' })
  minRevenue?: number;

  @ApiProperty({
    example: 60,
    description:
      'Minutes before departure to evaluate auto-cancel. Required when autoCancelEnabled is true.',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'autoCancelOffset must be an integer' })
  @Min(1, { message: 'autoCancelOffset must be at least 1' })
  autoCancelOffset?: number;
}
