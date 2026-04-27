import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsPositive, Min } from 'class-validator';
import { PlanName } from '../../domain/interfaces';

/**
 * Input DTO for the `POST /plans` endpoint.
 *
 * @remarks
 * This operation is restricted to development environments and protected by `DevGuard`.
 * All fields are required and validated via `class-validator`.
 */
export class CreatePlanDto {
  @ApiProperty({ example: PlanName.BASIC, enum: PlanName })
  @IsEnum(PlanName)
  name: PlanName;

  @ApiProperty({ example: 49.9, description: 'Monthly price in BRL' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  maxVehicles: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsPositive()
  maxDrivers: number;

  @ApiProperty({ example: 60 })
  @IsInt()
  @IsPositive()
  maxMonthlyTrips: number;
}
