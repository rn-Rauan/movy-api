import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for {@link LogoutUseCase} — `POST /auth/logout`.
 *
 * @remarks
 * The refresh token is the credential being revoked.
 * No `Authorization` header is required — the endpoint is intentionally public
 * so clients can logout even after the access token has expired.
 */
export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token to revoke',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
