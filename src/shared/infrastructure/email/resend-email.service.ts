import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMetadata, EmailService } from './email.service.interface';

@Injectable()
export class ResendEmailService extends EmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async send(
    to: string,
    subject: string,
    body: string,
    metadata?: EmailMetadata,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
    const fromName = this.configService.get<string>('RESEND_FROM_NAME') ?? 'Movy';

    if (!apiKey || !fromEmail) {
      this.logger.warn(
        '[Email] Resend is not configured; skipping outbound email. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
      );
      return;
    }

    const from = `${fromName} <${fromEmail}>`;
    const payload = {
      from,
      to: [to],
      subject,
      text: body,
      ...(metadata
        ? {
            tags: [
              {
                name: 'kind',
                value: String(metadata.kind ?? 'generic'),
              },
            ],
          }
        : {}),
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Resend email delivery failed (status=${response.status}): ${errorText}`,
      );
    }

    this.logger.log(
      `[Email] sent via Resend to=${to} subject="${subject}"` +
        (metadata ? ` metadata=${JSON.stringify(metadata)}` : ''),
    );
  }
}
