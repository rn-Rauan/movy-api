import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

/**
 * @param userEmail - The email of the user to be added to the organization
 * @param roleId - The ID of the role to be assigned to the user within the organization
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
