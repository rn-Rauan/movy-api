import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

/**
 * Input DTO for the {@link CreateOrganizationUseCase} — `POST /organizations`.
 *
 * @remarks
 * All fields are required. `cnpj` is validated by the {@link Cnpj} Value Object;
 * `slug` must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
 */
export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Organization' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'contact@myorg.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @IsNotEmpty({ message: 'CNPJ is required' })
  cnpj: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Telephone is required' })
  telephone: string;

  @ApiProperty({ example: 'my-org' })
  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  slug: string;

  @ApiProperty({ example: 'Rua Exemplo, 123' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;
}
