import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for registering a new organization along with its admin user.
 * @param userName - Admin user's full name
 * @param userEmail - Admin user's email
 * @param userPassword - Admin user's password (min 8 characters)
 * @param userTelephone - Admin user's telephone
 * @param organizationName - Name of the organization
 * @param cnpj - Unique CNPJ of the organization
 * @param organizationEmail - Organization's contact email
 * @param organizationTelephone - Organization's contact telephone
 * @param address - Organization's address
 * @param slug - Unique URL slug for the organization
 */
export class RegisterOrganizationWithAdminDto {
  // User Info
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user (Admin)',
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    example: 'admin@mycompany.com',
    description: 'The email of the user (Admin)',
  })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user (Admin)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  userPassword: string;

  @ApiProperty({
    example: '11999999999',
    description: 'The telephone number of the user (Admin)',
  })
  @IsString()
  @IsNotEmpty()
  userTelephone: string;

  // Organization Info
  @ApiProperty({
    example: 'My Company',
    description: 'The name of the organization',
  })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({
    example: '12345678000199',
    description: 'The CNPJ of the organization',
  })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({
    example: 'contact@mycompany.com',
    description: 'The contact email of the organization',
  })
  @IsEmail()
  @IsNotEmpty()
  organizationEmail: string;

  @ApiProperty({
    example: '11888888888',
    description: 'The contact telephone of the organization',
  })
  @IsString()
  @IsNotEmpty()
  organizationTelephone: string;

  @ApiProperty({
    example: 'Main St, 123',
    description: 'The address of the organization',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'my-company',
    description: 'The slug for the organization URL',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
