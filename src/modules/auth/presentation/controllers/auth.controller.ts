import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  SetupOrganizationDto,
  TokenResponseDto,
} from '../../application/dtos';
import { RegisterOrganizationWithAdminDto } from '../../application/dtos/register-organization.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterOrganizationWithAdminUseCase } from '../../application/use-cases';
import { SetupOrganizationForExistingUserUseCase } from '../../application/use-cases';
import { JwtAuthGuard } from 'src/shared/infrastructure/guards/jwt.guard';
import { GetUser } from 'src/shared/infrastructure/decorators/get-user.decorator';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

/**
 * HTTP controller for authentication flows.
 *
 * @remarks
 * All endpoints are public except `POST /auth/setup-organization`,
 * which requires a valid `JwtAuthGuard` bearer token.
 *
 * | Method | Path | Guard | Use Case |
 * |--------|------|-------|----------|
 * | `POST` | `/auth/login` | — | `LoginUseCase` |
 * | `POST` | `/auth/register` | — | `RegisterUseCase` |
 * | `POST` | `/auth/register-organization` | — | `RegisterOrganizationWithAdminUseCase` |
 * | `POST` | `/auth/setup-organization` | `JwtAuthGuard` | `SetupOrganizationForExistingUserUseCase` |
 * | `POST` | `/auth/refresh` | — | `RefreshTokenUseCase` |
 *
 * Base path: `/auth`
 */
/**
 * HTTP controller for authentication flows.
 *
 * @remarks
 * All endpoints are public except `POST /auth/setup-organization`,
 * which requires a valid `JwtAuthGuard` bearer token.
 *
 * | Method | Path | Guard | Use Case |
 * |--------|------|-------|----------|
 * | `POST` | `/auth/login` | — | `LoginUseCase` |
 * | `POST` | `/auth/register` | — | `RegisterUseCase` |
 * | `POST` | `/auth/register-organization` | — | `RegisterOrganizationWithAdminUseCase` |
 * | `POST` | `/auth/setup-organization` | `JwtAuthGuard` | `SetupOrganizationForExistingUserUseCase` |
 * | `POST` | `/auth/refresh` | — | `RefreshTokenUseCase` |
 *
 * Base path: `/auth`
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly registerOrganizationWithAdminUseCase: RegisterOrganizationWithAdminUseCase,
    private readonly setupOrganizationForExistingUserUseCase: SetupOrganizationForExistingUserUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.loginUseCase.execute(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.registerUseCase.execute(registerDto);
  }

  @Post('register-organization')
  @ApiOperation({ summary: 'Register new user and organization (Atomic)' })
  @ApiResponse({
    status: 201,
    description: 'User and organization registered successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User or Organization already exists',
  })
  async registerOrganization(
    @Body() registerOrganizationDto: RegisterOrganizationWithAdminDto,
  ): Promise<TokenResponseDto> {
    return this.registerOrganizationWithAdminUseCase.execute(
      registerOrganizationDto,
    );
  }

  @Post('setup-organization')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create an organization for an already-authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization created and new JWT issued with org context',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Organization already exists' })
  async setupOrganization(
    @Body() setupDto: SetupOrganizationDto,
    @GetUser() user: TenantContext,
  ): Promise<TokenResponseDto> {
    return this.setupOrganizationForExistingUserUseCase.execute(
      setupDto,
      user.userId,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }
}
