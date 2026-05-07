import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * Input DTO for the `PATCH /organizations/:organizationId/subscriptions/:id` endpoint.
 *
 * Replaces the `planId` of an existing ACTIVE subscription, recalculating `expiresAt`
 * from the new plan's `durationDays`. The same subscription record is preserved
 * (no new row is inserted), keeping the historical `id`, `startDate` and `createdAt`.
 */
export class UpdateSubscriptionPlanDto {
  @ApiProperty({
    example: 2,
    description: 'ID of the new plan to assign to the active subscription',
  })
  @IsInt()
  @IsPositive()
  planId: number;
}
