import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for setting up an organization for an already authenticated user.
 * @param organizationName - Name of the organization
 * @param cnpj - Unique CNPJ
 * @param organizationEmail - Organization's contact email
 * @param organizationTelephone - Organization's contact telephone
 * @param address - Organization's address
 * @param slug - Unique URL slug for the organization
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
