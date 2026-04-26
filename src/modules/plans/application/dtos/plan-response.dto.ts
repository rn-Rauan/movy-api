import { ApiProperty } from '@nestjs/swagger';
import { PlanName } from '../../domain/interfaces';

export class PlanResponseDto {
  @ApiProperty() id: number;
  @ApiProperty({ enum: PlanName }) name: PlanName;
  @ApiProperty() price: number;
  @ApiProperty() maxVehicles: number;
  @ApiProperty() maxDrivers: number;
  @ApiProperty() maxMonthlyTrips: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
