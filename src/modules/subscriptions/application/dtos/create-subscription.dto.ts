import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
/**
 * Input DTO for the `POST /organizations/:organizationId/subscriptions` endpoint.
 *
 * The `organizationId` is not part of the body — it is extracted from the route
 * parameter and injected into the use case by the controller.
 */ export class CreateSubscriptionDto {
  @ApiProperty({ example: 2, description: 'ID of the plan to subscribe to' })
  @IsInt()
  @IsPositive()
  planId: number;
}
