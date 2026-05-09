import { ApiProperty } from '@nestjs/swagger';

export class PlanUsageBucketDto {
  @ApiProperty() used: number;
  @ApiProperty() max: number;
}

/**
 * HTTP response shape for `GET /organizations/:organizationId/plan-usage`.
 *
 * Each bucket reports the current count consumed by the organisation against
 * the limit configured on the plan attached to its active subscription.
 */
export class PlanUsageResponseDto {
  @ApiProperty({ type: PlanUsageBucketDto }) vehicles: PlanUsageBucketDto;
  @ApiProperty({ type: PlanUsageBucketDto }) drivers: PlanUsageBucketDto;
  @ApiProperty({ type: PlanUsageBucketDto }) monthlyTrips: PlanUsageBucketDto;
}
