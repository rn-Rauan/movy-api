import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  userEmail?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: 'Role ID is required' })
  roleId: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsString()
  @IsUUID()
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;
}
