import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '../../domain/interfaces/enums/driver-status.enum';

/**
 * Response DTO for driver lookup (admin enrollment flow).
 * @param driverId - Driver profile ID
 * @param userId - User ID (needed to create membership)
 * @param userName - User's full name
 * @param userEmail - User's email
 * @param cnhCategory - License category
 * @param cnhExpiresAt - License expiration date
 * @param driverStatus - Current driver status
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
