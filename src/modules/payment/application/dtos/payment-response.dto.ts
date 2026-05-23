import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MethodPayment } from '../../domain/interfaces/enums/method-payment.enum';
import { PaymentStatus } from '../../domain/interfaces/enums/payment-status.enum';

/**
 * HTTP response shape returned by all payment endpoints.
 *
 * The `amount` field is serialised as a plain `number` (extracted from the
 * {@link Money} Value Object by the {@link PaymentPresenter}).
 *
 * `tripInstanceId` and `tripDepartureTime` are read-time snapshots derived
 * from the payment's enrollment → trip instance relation. The frontend uses
 * `tripDepartureTime` to bucket revenue by trip date (not by payment date).
 */
export class PaymentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() enrollmentId: string;
  @ApiProperty({ enum: MethodPayment }) method: MethodPayment;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'UUID of the TripInstance behind the booking. Absent only when the payment has no enrollment.',
  })
  tripInstanceId?: string;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description:
      'Snapshot of the related TripInstance departure time at query time. Used by the frontend to bucket revenue by trip date.',
  })
  tripDepartureTime?: Date;
}
