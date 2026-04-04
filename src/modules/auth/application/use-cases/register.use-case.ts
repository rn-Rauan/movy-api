import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { RegisterDto, TokenResponseDto } from '../dtos';
import { LoginUseCase } from './login.use-case';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

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