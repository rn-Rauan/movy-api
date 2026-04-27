import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../domain/interfaces/enums/vehicle-status.enum';
import { VehicleType } from '../../domain/interfaces/enums/vehicle-type.enum';

/**
 * Output DTO for all vehicle endpoints.
 *
 * @remarks
 * Mirrors all {@link VehicleEntity} public fields, including audit timestamps
 * (`createdAt`, `updatedAt`) and enum values for `type` and `status`.
 * The `plate` field contains the normalised 7-character string (uppercase, no hyphen).
 */
export class VehicleResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Unique identifier of the vehicle',
  })
  id: string;

  @ApiProperty({ example: 'ABC1D23', description: 'Vehicle plate' })
  plate: string;

  @ApiProperty({
    example: 'Mercedes-Benz Sprinter',
    description: 'Vehicle model',
  })
  model: string;

  @ApiProperty({
    example: 'VAN',
    description: 'Vehicle type',
    enum: VehicleType,
  })
  type: VehicleType;

  @ApiProperty({ example: 15, description: 'Maximum passenger capacity' })
  maxCapacity: number;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Current vehicle status',
    enum: VehicleStatus,
  })
  status: VehicleStatus;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Organization that owns this vehicle',
  })
  organizationId: string;

  @ApiProperty({
    example: '2026-04-17T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-04-17T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  constructor(props: Partial<VehicleResponseDto>) {
    Object.assign(this, props);
  }
}
