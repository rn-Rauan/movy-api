import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for refreshing JWT tokens.
 * @param refreshToken - The refresh token issued during login
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
