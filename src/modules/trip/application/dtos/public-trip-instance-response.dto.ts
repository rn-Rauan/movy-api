import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
/**
 * DTO representing the public-facing data of a {@link TripInstance}, as returned by the `GET /trips/instances/public` endpoint.
 *
 * This is a flattened structure that combines fields from the `TripInstance` entity
 */
export class PublicTripInstanceResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Unique identifier of the trip instance',
  })
  id: string;

  @ApiProperty({
    example: 'uuid',
    description:
      'Unique identifier of the organization that owns the trip instance',
  })
  organizationId: string;

  @ApiProperty({
    example: 'uuid',
    description:
      'Unique identifier of the trip template that defines the trip instance',
  })
  tripTemplateId: string;

  @ApiProperty({
    example: 'SCHEDULED',
    description: 'Current status of the trip instance',
  })
  tripStatus: string;

  @ApiProperty({
    example: '2023-01-01T10:00:00Z',
    description: 'Scheduled departure time of the trip instance',
  })
  departureTime: Date;

  @ApiProperty({
    example: '2023-01-01T12:00:00Z',
    description: 'Estimated arrival time of the trip instance',
  })
  arrivalEstimate: Date;

  @ApiProperty({
    example: 20,
    description: 'Total capacity of the trip instance',
  })
  totalCapacity: number;

  @ApiProperty({
    example: 'Av. Paulista, 1000',
    description: 'Departure point of the trip instance',
  })
  departurePoint: string;

  @ApiProperty({
    example: 'Av. Faria Lima, 500',
    description: 'Destination of the trip instance',
  })
  destination: string;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Price for a one-way trip',
  })
  priceOneWay: number | null;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Price for a return trip',
  })
  priceReturn: number | null;

  @ApiPropertyOptional({ example: 28.0, description: 'Price for a round-trip' })
  priceRoundTrip: number | null;

  @ApiProperty({
    example: true,
    description: 'Whether the trip instance is recurring',
  })
  isRecurring: boolean;
}
