import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;
}
