import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP response shape for a single passenger entry in a trip instance.
 *
 * Intentionally omits `userId`, `email`, and `telephone` — only the display
 * name and boarding stop are exposed to preserve passenger privacy.
 */
export class TripPassengerResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the passenger',
  })
  userId: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Display name of the passenger',
  })
  name: string;

  @ApiProperty({
    example: 'A2',
    description: 'Boarding stop identifier',
  })
  boardingStop: string;
}
