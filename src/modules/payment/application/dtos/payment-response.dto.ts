import { ApiProperty } from '@nestjs/swagger';
import { MethodPayment } from '../../domain/interfaces/enums/method-payment.enum';
import { PaymentStatus } from '../../domain/interfaces/enums/payment-status.enum';

/**
 * HTTP response shape returned by all payment endpoints.
 *
 * The `amount` field is serialised as a plain `number` (extracted from the
 * {@link Money} Value Object by the {@link PaymentPresenter}).
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
}
