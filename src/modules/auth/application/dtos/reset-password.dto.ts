import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Input for `POST /auth/reset-password`.
 *
 * `token` is the raw UUID emailed to the user; `newPassword` is the plaintext
 * password to be hashed and persisted. The minimum length matches the same
 * constraint applied at user creation.
 */
export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw password-reset token received by email' })
  @IsString()
  @IsNotEmpty({ message: 'token is required' })
  token: string;

  @ApiProperty({ example: 'newStrongP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'newPassword must be at least 8 characters' })
  newPassword: string;
}
