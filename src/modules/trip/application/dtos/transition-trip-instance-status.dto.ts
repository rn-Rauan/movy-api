import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TripStatus } from '../../domain/interfaces';

/**
 * DTO for transitioning a trip instance to a new lifecycle status.
 */
export class TransitionTripInstanceStatusDto {
  @ApiProperty({
    example: TripStatus.SCHEDULED,
    description: 'The new status to transition the trip instance to',
    enum: TripStatus,
  })
  @IsEnum(TripStatus, {
    message: `newStatus must be one of: ${Object.values(TripStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'newStatus is required' })
  newStatus: TripStatus;
}
