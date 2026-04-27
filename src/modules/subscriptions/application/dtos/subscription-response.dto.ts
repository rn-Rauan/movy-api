import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../../domain/interfaces';

/**
 * HTTP response shape returned by all subscription endpoints.
 */
export class SubscriptionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() planId: number;
  @ApiProperty({ enum: SubscriptionStatus }) status: SubscriptionStatus;
  @ApiProperty() startDate: Date;
  @ApiProperty() expiresAt: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
