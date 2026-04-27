import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

/**
 * Input DTO for {@link CreateMembershipUseCase} — `POST /memberships`.
 *
 * @remarks
 * `roleId` maps to the seeded `Role` table: `1 = ADMIN`, `2 = DRIVER`.
 * For the `DRIVER` role the user must already have a driver profile.
 */
export class CreateMembershipDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'User email is required' })
  userEmail: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: number;
}
