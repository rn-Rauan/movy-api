import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DayOfWeek } from '../../domain/interfaces/enums/day-of-week.enum';
import { Shift } from '../../domain/interfaces/enums/shift.enum';

/**
 * Input DTO for `PUT /trip-templates/:id`.
 *
 * All fields are optional; only provided fields are applied to the template.
 * Partial pricing updates are merged with the template's existing prices,
 * and all domain invariants are re-validated after the merg
 *
 * All fields are optional; only provided fields are applied to the template.
 * Partial pricing updates are merged with the template's existing prices,
 * and all domain invariants are re-validated after the merge.
 */
export class UpdateTripTemplateDto {
  @ApiPropertyOptional({
    example: 'Terminal Rodoviário',
    description: 'Starting location of the trip',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'departurePoint must be a string' })
  @MaxLength(255, { message: 'departurePoint must not exceed 255 characters' })
  departurePoint?: string;

  @ApiPropertyOptional({
    example: 'Universidade Federal',
    description: 'Final destination of the trip',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'destination must be a string' })
  @MaxLength(255, { message: 'destination must not exceed 255 characters' })
  destination?: string;

  @ApiPropertyOptional({
    example: ['Terminal Rodoviário', 'Praça Central', 'Universidade Federal'],
    description: 'Ordered list of stops (min 2)',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'stops must be an array' })
  @ArrayMinSize(2, { message: 'stops must contain at least 2 items' })
  @IsString({ each: true, message: 'Each stop must be a string' })
  stops?: string[];

  @ApiPropertyOptional({
    example: 'MORNING',
    description: 'Shift classification for the trip',
    enum: Shift,
  })
  @IsOptional()
  @IsEnum(Shift, {
    message: 'shift must be one of: MORNING, AFTERNOON, EVENING',
  })
  shift?: Shift;

  @ApiPropertyOptional({
    example: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    description: 'Days of the week when the trip recurs',
    enum: DayOfWeek,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'frequency must be an array' })
  @IsEnum(DayOfWeek, {
    each: true,
    message: 'Each frequency day must be a valid DayOfWeek',
  })
  frequency?: DayOfWeek[];

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Price for one-way enrollment (BRL)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceOneWay must be a number' })
  @Min(0, { message: 'priceOneWay must be >= 0' })
  priceOneWay?: number;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Price for return enrollment (BRL)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceReturn must be a number' })
  @Min(0, { message: 'priceReturn must be >= 0' })
  priceReturn?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Price for round-trip enrollment (BRL)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'priceRoundTrip must be a number' })
  @Min(0, { message: 'priceRoundTrip must be >= 0' })
  priceRoundTrip?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the trip is visible to all organizations',
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic must be a boolean' })
  isPublic?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the trip recurs on the defined frequency',
  })
  @IsOptional()
  @IsBoolean({ message: 'isRecurring must be a boolean' })
  isRecurring?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether auto-cancel based on minimum revenue is enabled',
  })
  @IsOptional()
  @IsBoolean({ message: 'autoCancelEnabled must be a boolean' })
  autoCancelEnabled?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum revenue threshold for auto-cancel (BRL)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'minRevenue must be a number' })
  @Min(0, { message: 'minRevenue must be >= 0' })
  minRevenue?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Minutes before departure to evaluate auto-cancel',
  })
  @IsOptional()
  @IsInt({ message: 'autoCancelOffset must be an integer' })
  @Min(1, { message: 'autoCancelOffset must be at least 1' })
  autoCancelOffset?: number;
}
