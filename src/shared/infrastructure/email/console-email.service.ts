import { Injectable, Logger } from '@nestjs/common';
import { EmailMetadata, EmailService } from './email.service.interface';
import { InMemoryEmailLog } from './in-memory-email-log';

/**
 * Dev/test implementation of {@link EmailService}.
 *
 * Does not perform any network I/O. Each `send()` call:
 * 1. Logs the message via NestJS `Logger` (visible in `start:dev` stdout).
 * 2. Appends to {@link InMemoryEmailLog} so dev tooling and the FE in dev mode
 *    can recover the contents via `GET /dev/emails/latest`.
 *
 * Always resolves successfully — callers do not need defensive error handling
 * beyond what they would apply to a real transport.
 */
@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  constructor(private readonly emailLog: InMemoryEmailLog) {
    super();
  }

  async send(
    to: string,
    subject: string,
    body: string,
    metadata?: EmailMetadata,
  ): Promise<void> {
    const sentAt = new Date();

    this.logger.log(
      `[Email] → to=${to} subject="${subject}"` +
        (metadata ? ` metadata=${JSON.stringify(metadata)}` : ''),
    );
    this.logger.debug(`[Email body]\n${body}`);

    this.emailLog.push({ to, subject, body, metadata, sentAt });

    return Promise.resolve();
  }
}
