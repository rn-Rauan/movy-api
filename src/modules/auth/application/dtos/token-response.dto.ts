import { ApiProperty } from '@nestjs/swagger';

/**
 * HTTP response shape returned by all auth endpoints that issue JWTs.
 *
 * @remarks
 * `accessToken` expires in 1 h; `refreshToken` expires in 7 d.
 * Both are signed with the enriched {@link JwtPayload} (includes `organizationId`,
 * `role`, `isDev`, and `userStatus`).
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
