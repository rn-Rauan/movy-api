import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  SetupOrganizationDto,
  TokenResponseDto,
  VerifyEmailDto,
} from '../../application/dtos';
import { RegisterOrganizationWithAdminDto } from '../../application/dtos/register-organization.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import {
  ForgotPasswordUseCase,
  RegisterOrganizationWithAdminUseCase,
  ResetPasswordUseCase,
  SetupOrganizationForExistingUserUseCase,
  VerifyEmailUseCase,
} from '../../application/use-cases';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
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
 * | `POST` | `/auth/logout` | — | `LogoutUseCase` |
 * | `POST` | `/auth/forgot-password` | — | `ForgotPasswordUseCase` (always 204) |
 * | `POST` | `/auth/reset-password` | — | `ResetPasswordUseCase` (auto-login on success) |
 * | `POST` | `/auth/verify-email` | — | `VerifyEmailUseCase` |
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
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
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

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke refresh token (logout)' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.logoutUseCase.execute(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Request a password-reset email (always 204, even if email is unknown)',
    description:
      'Constant-response endpoint to prevent account enumeration. If the email ' +
      'maps to an ACTIVE user, a reset token (1h TTL) is emailed; otherwise the ' +
      'request is silently dropped. Always responds with 204.',
  })
  @ApiResponse({ status: 204, description: 'Request accepted' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordUseCase.execute(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Redeem a password-reset token and set a new password',
    description:
      "On success, all the user's active refresh tokens are revoked and a fresh " +
      'access/refresh pair is issued (auto-login).',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset; auto-login',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalid, expired, or already used',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<TokenResponseDto> {
    return this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Redeem an email-verification token',
    description:
      "Marks the user's emailVerifiedAt to the current instant. The token is " +
      'single-use (24h TTL).',
  })
  @ApiResponse({ status: 204, description: 'Email verified' })
  @ApiResponse({
    status: 400,
    description: 'Token invalid, expired, or already used',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.verifyEmailUseCase.execute(dto.token);
  }
}
