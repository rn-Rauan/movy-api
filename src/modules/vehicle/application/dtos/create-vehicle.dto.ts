import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleType } from '../../domain/interfaces/enums/vehicle-type.enum';

/**
 * DTO for registering a new vehicle.
 * @param plate - Brazilian plate string (old or Mercosul format, 7 chars)
 * @param model - Vehicle model description
 * @param type - Vehicle type (VAN, BUS, MINIBUS, CAR)
 * @param maxCapacity - Maximum passenger capacity (positive integer)
 */
export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABC1D23',
    description: 'Brazilian vehicle plate (old: ABC1234 or Mercosul: ABC1D23)',
    maxLength: 7,
  })
  @IsString({ message: 'Plate must be a string' })
  @IsNotEmpty({ message: 'Plate is required' })
  @MaxLength(8, { message: 'Plate must not exceed 8 characters' })
  plate: string;

  @ApiProperty({
    example: 'Mercedes-Benz Sprinter',
    description: 'Vehicle model description',
  })
  @IsString({ message: 'Model must be a string' })
  @IsNotEmpty({ message: 'Model is required' })
  @MaxLength(255, { message: 'Model must not exceed 255 characters' })
  model: string;

  @ApiProperty({
    example: 'VAN',
    description: 'Vehicle type',
    enum: VehicleType,
  })
  @IsEnum(VehicleType, {
    message: 'Type must be one of: VAN, BUS, MINIBUS, CAR',
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: VehicleType;

  @ApiProperty({
    example: 15,
    description: 'Maximum number of passengers',
    minimum: 1,
    maximum: 200,
  })
  @IsInt({ message: 'Max capacity must be an integer' })
  @Min(1, { message: 'Max capacity must be at least 1' })
  @Max(200, { message: 'Max capacity must not exceed 200' })
  maxCapacity: number;
}
