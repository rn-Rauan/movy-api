import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

/**
 * Input DTO for the {@link UpdateOrganizationUseCase} — `PUT /organizations/:id`.
 *
 * @remarks
 * All fields are optional to allow partial updates. Each provided unique field
 * (`cnpj`, `email`, `slug`) is checked for conflicts in the use case.
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'My Updated Organization' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'newcontact@myorg.com' })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12345678000199' })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiPropertyOptional({ example: '11988888888' })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({ example: 'new-slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Rua Nova, 456' })
  @IsString()
  @IsOptional()
  address?: string;
}
