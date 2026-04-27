import { ApiProperty } from '@nestjs/swagger';
import { PlanName } from '../../domain/interfaces';

/**
 * HTTP response shape returned by all plan endpoints.
 *
 * The `price` field is serialised as a plain `number` (extracted from the
 * {@link Money} Value Object by the {@link PlanPresenter}).
 */
export class PlanResponseDto {
  @ApiProperty() id: number;
  @ApiProperty({ enum: PlanName }) name: PlanName;
  @ApiProperty() price: number;
  @ApiProperty() maxVehicles: number;
  @ApiProperty() maxDrivers: number;
  @ApiProperty() maxMonthlyTrips: number;
  @ApiProperty() durationDays: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
