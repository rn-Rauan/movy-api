import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { RegisterDto, TokenResponseDto } from '../dtos';
import { LoginUseCase } from './login.use-case';

/**
 * Registers a new user account and immediately authenticates them.
 *
 * @remarks
 * Delegates user creation to {@link CreateUserUseCase}, then delegates
 * authentication to {@link LoginUseCase}. The returned tokens are identical
 * to what a normal login would produce.
 * Throws `UserEmailAlreadyExistsError` if the email is already taken.
 */
/**
 * Registers a new user account and immediately authenticates them.
 *
 * @remarks
 * Delegates user creation to {@link CreateUserUseCase}, then delegates
 * authentication to {@link LoginUseCase}. The returned tokens are identical
 * to what a normal login would produce.
 * Throws `UserEmailAlreadyExistsError` if the email is already taken.
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  /**
   * Registers a new user and automatically logs them in.
   * @param registerDto - User registration data (name, email, password, telephone)
   * @returns TokenResponseDto with access token, refresh token, and user info
   * @throws UserEmailAlreadyExistsError if email is already taken
   */
  async execute(registerDto: RegisterDto): Promise<TokenResponseDto> {
    // Create the user
    await this.createUserUseCase.execute({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      telephone: registerDto.telephone || '',
    });

    // Auto-login after registration
    return this.loginUseCase.execute({
      email: registerDto.email,
      password: registerDto.password,
    });
  }
}
