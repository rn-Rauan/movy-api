import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for {@link AssociateDriverToOrganizationUseCase} — `POST /memberships/driver`.
 *
 * Requires both email and CNH so the admin must know two independent identifiers
 * before linking a driver to their organization.
 */
export class AssociateDriverDto {
  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'User email is required' })
  userEmail: string;

  @ApiProperty({ example: '12345678901' })
  @IsString()
  @IsNotEmpty({ message: 'CNH is required' })
  cnh: string;
}
