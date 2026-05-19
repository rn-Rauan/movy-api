import { Injectable, Logger } from '@nestjs/common';
import { EmailVerificationToken } from '../../domain/entities/email-verification-token.entity';
import { EmailVerificationTokenRepository } from '../../domain/interfaces/email-verification-token.repository';
import { EmailService } from 'src/shared/infrastructure/email/email.service.interface';

/**
 * Internal helper that issues an email-verification token and emails it to the
 * user. Composed by the register flows (fire-and-forget) and may later be
 * exposed via a "resend verification" endpoint.
 *
 * Persists only the hashed token; the raw value is embedded in the outgoing
 * email body.
 */
@Injectable()
export class SendEmailVerificationUseCase {
  private readonly logger = new Logger(SendEmailVerificationUseCase.name);

  constructor(
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Issues a fresh verification token and sends the email.
   *
   * @param userId       - UUID of the user being verified
   * @param recipient    - Email address to deliver the verification link to
   * @param recipientName - Display name used in the email body
   */
  async execute(
    userId: string,
    recipient: string,
    recipientName: string,
  ): Promise<void> {
    const token = EmailVerificationToken.create(userId);
    await this.tokenRepository.save(token);

    const rawToken = token.rawToken!;
    const subject = 'Confirme seu email — Movy';
    const body =
      `Olá ${recipientName},\n\n` +
      `Confirme seu email no Movy clicando no link abaixo ou usando o token ` +
      `no aplicativo:\n\n` +
      `Token: ${rawToken}\n\n` +
      `O token expira em 24 horas. Se você não criou a conta, ignore este email.\n`;

    await this.emailService.send(recipient, subject, body, {
      kind: 'email_verification',
      userId,
      token: rawToken,
    });

    this.logger.log(
      `[SendEmailVerification] queued userId=${userId} email=${recipient}`,
    );
  }
}
