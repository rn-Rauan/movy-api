import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { EnrollmentType } from '../../domain/interfaces';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';

/**
 * DTO for creating a new booking (enrollment) in a trip instance.
 * organizationId and userId are extracted from the JWT — never sent in body.
 * recordedPrice is resolved server-side from the TripTemplate — never trusted from client.
 */
export class CreateBookingDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'UUID of the trip instance to enroll in',
  })
  @IsUUID('4', { message: 'tripInstanceId must be a valid UUID' })
  @IsNotEmpty({ message: 'tripInstanceId is required' })
  tripInstanceId: string;

  @ApiProperty({
    example: EnrollmentType.ONE_WAY,
    description: 'Type of enrollment',
    enum: EnrollmentType,
  })
  @IsEnum(EnrollmentType, {
    message: 'enrollmentType must be a valid EnrollmentType',
  })
  enrollmentType: EnrollmentType;

  @ApiProperty({
    example: 'A2',
    description: 'Boarding stop identifier',
  })
  @IsString()
  @IsNotEmpty({ message: 'boardingStop is required' })
  boardingStop: string;

  @ApiProperty({
    example: 'B5',
    description: 'Alighting stop identifier',
  })
  @IsString()
  @IsNotEmpty({ message: 'alightingStop is required' })
  alightingStop: string;

  @ApiProperty({
    example: MethodPayment.PIX,
    description: 'Payment method for this booking',
    enum: MethodPayment,
  })
  @IsEnum(MethodPayment, { message: 'method must be a valid MethodPayment' })
  method: MethodPayment;
}
