import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for {@link RefreshTokenUseCase} — `POST /auth/refresh`.
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token issued during login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
