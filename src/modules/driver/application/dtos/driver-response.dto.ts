import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../../domain/interfaces/enums/driver-status.enum';

export class DriverResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The unique identifier of the driver',
  })
  id: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The user ID associated with this driver',
  })
  userId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The organization ID this driver belongs to',
  })
  organizationId: string;

  @ApiProperty({
    example: '123456789',
    description: 'Driver license number (CNH)',
  })
  cnh: string;

  @ApiProperty({
    example: 'B',
    description: 'Driver license category',
  })
  cnhCategory: string;

  @ApiProperty({
    example: '2028-12-31T00:00:00.000Z',
    description: 'CNH expiration date',
  })
  cnhExpiresAt: Date;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Current status of the driver',
  })
  driverStatus: DriverStatus;

  @ApiProperty({
    example: '2026-04-11T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-04-11T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  constructor(props: Partial<DriverResponseDto>) {
    Object.assign(this, props);
  }
}
