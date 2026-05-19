import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Input for `POST /auth/forgot-password`.
 *
 * The endpoint always returns 204 — whether or not the email maps to an
 * existing account — so the only validation here is well-formedness.
 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}
