import { Injectable, Logger } from '@nestjs/common';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { RegisterDto, TokenResponseDto } from '../dtos';
import { LoginUseCase } from './login.use-case';
import { SendEmailVerificationUseCase } from './send-email-verification.use-case';

/**
 * Registers a new user account and immediately authenticates them.
 *
 * @remarks
 * Delegates user creation to {@link CreateUserUseCase}, then delegates
 * authentication to {@link LoginUseCase}. After successful creation, fires
 * (fire-and-forget) {@link SendEmailVerificationUseCase} so the user can
 * confirm their email — failures are swallowed and logged so a flaky email
 * transport never blocks a registration. The user can request a new
 * verification later if needed.
 *
 * Throws `UserEmailAlreadyExistsError` if the email is already taken.
 */
@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly sendEmailVerification: SendEmailVerificationUseCase,
  ) {}

  /**
   * Registers a new user and automatically logs them in.
   * @param registerDto - User registration data (name, email, password, telephone)
   * @returns TokenResponseDto with access token, refresh token, and user info
   * @throws UserEmailAlreadyExistsError if email is already taken
   */
  async execute(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const user = await this.createUserUseCase.execute({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      telephone: registerDto.telephone || '',
    });

    // Fire-and-forget email verification — never block registration on email I/O.
    try {
      await this.sendEmailVerification.execute(user.id, user.email, user.name);
    } catch (err) {
      this.logger.warn(
        `[Register] verification email failed for userId=${user.id}: ${(err as Error).message}`,
      );
    }

    return this.loginUseCase.execute({
      email: registerDto.email,
      password: registerDto.password,
    });
  }
}
