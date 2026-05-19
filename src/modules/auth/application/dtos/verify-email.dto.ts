import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for `POST /auth/verify-email`.
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Raw email-verification token received by email',
  })
  @IsString()
  @IsNotEmpty({ message: 'token is required' })
  token: string;
}
