import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { EmailService } from 'src/shared/infrastructure/email/email.service.interface';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '../../domain/interfaces/password-reset-token.repository';

/**
 * Initiates the "forgot password" flow.
 *
 * Behaviour is **constant-response**: the use case always resolves successfully,
 * regardless of whether the email maps to a real account. The controller
 * returns HTTP 204 in both cases. This prevents account-enumeration attacks
 * (otherwise a probe could distinguish "registered" from "not registered"
 * by inspecting status codes).
 *
 * When the email *is* registered:
 * 1. A {@link PasswordResetToken} is issued (1h TTL, hashed at rest).
 * 2. The raw token is emailed to the user via {@link EmailService}.
 * 3. The user posts the raw token + new password to `/auth/reset-password`.
 *
 * Inactive (`status = INACTIVE`) users are treated as non-existent — no email
 * is sent and no token is created.
 */
@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.status === 'INACTIVE') {
      this.logger.debug(
        `[ForgotPassword] no-op for ${email} (not found / inactive)`,
      );
      return;
    }

    const token = PasswordResetToken.create(user.id);
    await this.tokenRepository.save(token);

    const rawToken = token.rawToken!;
    const subject = 'Recuperação de senha — Movy';
    const body =
      `Olá ${user.name},\n\n` +
      `Recebemos um pedido para redefinir sua senha. Use o token abaixo no ` +
      `aplicativo ou no link de recuperação:\n\n` +
      `Token: ${rawToken}\n\n` +
      `O token expira em 1 hora. Se você não solicitou a recuperação, ignore este email — ` +
      `sua senha atual continua válida.\n`;

    await this.emailService.send(user.email, subject, body, {
      kind: 'password_reset',
      userId: user.id,
      token: rawToken,
    });

    this.logger.log(
      `[ForgotPassword] reset email queued for userId=${user.id}`,
    );
  }
}
