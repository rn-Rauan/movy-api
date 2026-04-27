import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for {@link SetupOrganizationForExistingUserUseCase} — `POST /auth/setup-organization`.
 *
 * @remarks
 * Used by an already-authenticated user (via `JwtAuthGuard`) to create an
 * organization and become its `ADMIN`. A new JWT with the organization context
 * is issued on success.
 */
export class SetupOrganizationDto {
  @ApiProperty({ example: 'My Company' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({ example: 'contact@mycompany.com' })
  @IsEmail()
  @IsNotEmpty()
  organizationEmail: string;

  @ApiProperty({ example: '11888888888' })
  @IsString()
  @IsNotEmpty()
  organizationTelephone: string;

  @ApiProperty({ example: 'Main St, 123' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'my-company' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
