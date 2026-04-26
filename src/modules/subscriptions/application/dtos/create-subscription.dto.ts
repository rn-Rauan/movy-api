import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 2, description: 'ID of the plan to subscribe to' })
  @IsInt()
  @IsPositive()
  planId: number;
}
