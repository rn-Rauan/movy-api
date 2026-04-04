import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto, RegisterDto, TokenResponseDto } from '../../application/dtos';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.loginUseCase.execute(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.registerUseCase.execute(registerDto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string): Promise<TokenResponseDto> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }
}