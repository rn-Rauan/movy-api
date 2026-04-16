import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO containing JWT tokens and basic user info.
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token (7d expiry)
 * @param user - Basic user info (id, name, email)
 */
export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
    },
    description: 'User information',
  })
  user: {
    id: string;
    name: string;
    email: string;
  };
}
