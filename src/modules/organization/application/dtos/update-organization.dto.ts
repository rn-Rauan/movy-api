import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

/**
 * DTO for updating an existing organization. All fields are optional to allow partial updates.
 * @param name - Organization name (optional)
 * @param email - Email contact (optional)
 * @param cnpj - Unique CNPJ number for the organization (optional)
 * @param telephone - Contact telephone (optional)
 * @param slug - Unique URL slug (optional)
 * @param address - Organization address (optional)
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
