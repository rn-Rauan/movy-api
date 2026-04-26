import { ApiProperty } from '@nestjs/swagger';
import { MethodPayment } from '../../domain/interfaces/enums/method-payment.enum';
import { PaymentStatus } from '../../domain/interfaces/enums/payment-status.enum';

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
