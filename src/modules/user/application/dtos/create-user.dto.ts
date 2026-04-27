import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Input DTO for `POST /users` (dev-only endpoint).
 *
 * @remarks
 * - `password` is a plaintext string hashed by {@link HashProvider} before storage;
 *   minimum 8 characters
 * - `email` must be unique in the system; conflicts throw {@link UserEmailAlreadyExistsError}
 * - `telephone` format is validated by the {@link Telephone} Value Object
 */
export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    example: '11999999999',
    description: 'The telephone number of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Telephone is required' })
  telephone: string;
}
