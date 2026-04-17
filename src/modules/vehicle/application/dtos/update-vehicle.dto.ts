import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleStatus } from '../../domain/interfaces/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/interfaces/enums/vehicle-type.enum';

/**
 * DTO for partial update of a vehicle.
 */
export class UpdateVehicleDto {
  @ApiPropertyOptional({
    example: 'ABC1D23',
    description: 'Brazilian vehicle plate (old: ABC1234 or Mercosul: ABC1D23)',
  })
  @IsOptional()
  @IsString({ message: 'Plate must be a string' })
  @MaxLength(8, { message: 'Plate must not exceed 8 characters' })
  plate?: string;

  @ApiPropertyOptional({
    example: 'Mercedes-Benz Sprinter',
    description: 'Vehicle model description',
  })
  @IsOptional()
  @IsString({ message: 'Model must be a string' })
  @MaxLength(255, { message: 'Model must not exceed 255 characters' })
  model?: string;

  @ApiPropertyOptional({
    example: 'VAN',
    description: 'Vehicle type',
    enum: VehicleType,
  })
  @IsOptional()
  @IsEnum(VehicleType, {
    message: 'Type must be one of: VAN, BUS, MINIBUS, CAR',
  })
  type?: VehicleType;

  @ApiPropertyOptional({
    example: 15,
    description: 'Maximum number of passengers',
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @IsInt({ message: 'Max capacity must be an integer' })
  @Min(1, { message: 'Max capacity must be at least 1' })
  @Max(200, { message: 'Max capacity must not exceed 200' })
  maxCapacity?: number;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Vehicle status',
    enum: VehicleStatus,
  })
  @IsOptional()
  @IsEnum(VehicleStatus, {
    message: 'Status must be one of: ACTIVE, INACTIVE',
  })
  status?: VehicleStatus;
}
