import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../../domain/interfaces/enums/driver-status.enum';

/**
 * HTTP response shape for the {@link LookupDriverUseCase} (admin enrollment flow).
 *
 * @remarks
 * Contains enough information for an admin to create a `Membership` linking
 * the found user to the organization without further lookups.
 */
export class DriverLookupResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The driver profile ID',
  })
  driverId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The user ID (needed to create membership)',
  })
  userId: string;

  @ApiProperty({ example: 'João Silva' })
  userName: string;

  @ApiProperty({ example: 'joao@email.com' })
  userEmail: string;

  @ApiProperty({ example: 'B' })
  cnhCategory: string;

  @ApiProperty({ example: '2028-12-31T00:00:00.000Z' })
  cnhExpiresAt: Date;

  @ApiProperty({ example: 'ACTIVE', enum: DriverStatus })
  driverStatus: DriverStatus;

  constructor(props: Partial<DriverLookupResponseDto>) {
    Object.assign(this, props);
  }
}
