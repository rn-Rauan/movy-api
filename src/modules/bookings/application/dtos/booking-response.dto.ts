import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentType } from '../../domain/interfaces';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';
import type { Status } from 'src/shared/domain/types';

/**
 * HTTP response shape returned by all booking endpoints.
 *
 * The `recordedPrice` field is serialised as a plain `number` (extracted from the
 * {@link Money} Value Object by the {@link BookingPresenter}).
 */
export class BookingResponseDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Unique identifier of the booking',
  })
  id: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Organization that owns this booking',
  })
  organizationId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the user who made the booking',
  })
  userId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the trip instance this booking is for',
  })
  tripInstanceId: string;

  @ApiProperty({
    example: '2026-05-10T07:30:00.000Z',
    description: 'Date and time the booking was made',
  })
  enrollmentDate: Date;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Current status of the booking',
  })
  status: Status;

  @ApiProperty({
    example: false,
    description: 'Whether the passenger presence has been confirmed',
  })
  presenceConfirmed: boolean;

  @ApiProperty({
    example: EnrollmentType.ONE_WAY,
    description: 'Type of enrollment',
    enum: EnrollmentType,
  })
  enrollmentType: EnrollmentType;

  @ApiProperty({
    example: 49.9,
    description: 'Price snapshot at the time of booking (BRL)',
  })
  recordedPrice: number;

  @ApiProperty({
    example: 'A2',
    description: 'Boarding stop identifier',
  })
  boardingStop: string;

  @ApiProperty({
    example: 'B5',
    description: 'Alighting stop identifier',
  })
  alightingStop: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: 'PIX',
    enum: MethodPayment,
    nullable: true,
    description: 'Payment method used when creating the booking',
  })
  paymentMethod: MethodPayment | null;

  constructor(props: Partial<BookingResponseDto>) {
    Object.assign(this, props);
  }
}
