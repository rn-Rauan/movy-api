import { Injectable } from '@nestjs/common';
import { EmailMetadata } from './email.service.interface';

/**
 * Snapshot of a "sent" email kept in the in-memory log. Returned by
 * {@link InMemoryEmailLog} reads and serialised by `GET /dev/emails/latest`.
 */
export interface SentEmailRecord {
  to: string;
  subject: string;
  body: string;
  metadata?: EmailMetadata;
  sentAt: Date;
}

/**
 * Bounded FIFO buffer of the last 50 emails "sent" by {@link ConsoleEmailService}.
 *
 * Dev-only diagnostic surface: the FE in dev mode polls `GET /dev/emails/latest`
 * to grab tokens emitted by the email-verification and password-reset flows
 * without needing real inbox access. Not safe for prod (data lives in process
 * memory; reset on restart; not multi-instance aware).
 */
@Injectable()
export class InMemoryEmailLog {
  private static readonly MAX_SIZE = 50;
  private readonly buffer: SentEmailRecord[] = [];

  /**
   * Appends a record to the buffer; evicts the oldest entry when full.
   */
  push(record: SentEmailRecord): void {
    if (this.buffer.length >= InMemoryEmailLog.MAX_SIZE) {
      this.buffer.shift();
    }
    this.buffer.push(record);
  }

  /**
   * Returns the most recent email sent to a given recipient, or `null` if none
   * are buffered. Newest-first lookup.
   */
  findLatestByRecipient(to: string): SentEmailRecord | null {
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.buffer[i].to === to) return this.buffer[i];
    }
    return null;
  }

  /**
   * Returns up to `limit` most recent records (newest first).
   */
  latest(limit = 10): SentEmailRecord[] {
    return [...this.buffer].reverse().slice(0, limit);
  }
}
