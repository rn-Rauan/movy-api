/**
 * Free-form metadata attached to a sent email. Used by mock implementations to
 * surface the raw token in dev inspection endpoints; safe to ignore in real
 * SMTP/transactional implementations.
 */
export type EmailMetadata = Record<string, string | number | boolean>;

/**
 * Outbound email port.
 *
 * The application depends on this abstraction, not on any specific transport.
 * Implementations:
 * - {@link ConsoleEmailService} (mock) — used in dev and CI. Logs to stdout +
 *   pushes into {@link InMemoryEmailLog} so `GET /dev/emails/latest` can
 *   surface the message contents (including reset/verification tokens).
 * - Production implementation (e.g., Resend/SMTP) — future work.
 *
 * Switching transports is a one-line change in `SharedModule.providers`:
 * `{ provide: EmailService, useClass: NewEmailService }`.
 */
export abstract class EmailService {
  /**
   * Sends an email. Implementations decide synchronicity, retries, and queueing.
   * Callers should treat this as fire-and-forget for non-critical messages
   * (wrap in try/catch and log; never block the user-facing flow).
   *
   * @param to       - Recipient email
   * @param subject  - Email subject line
   * @param body     - Plain-text or HTML body (implementations may choose)
   * @param metadata - Optional structured metadata for inspection/observability
   */
  abstract send(
    to: string,
    subject: string,
    body: string,
    metadata?: EmailMetadata,
  ): Promise<void>;
}
