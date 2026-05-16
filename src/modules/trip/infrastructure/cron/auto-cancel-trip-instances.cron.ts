import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CancelExpiredTripInstancesUseCase } from '../../application/use-cases/cancel-expired-trip-instances.use-case';

/**
 * Scheduled job that runs every 15 minutes and cancels every expired
 * non-`forceConfirm` trip instance whose `autoCancelAt` is in the past.
 *
 * Thin wrapper around {@link CancelExpiredTripInstancesUseCase} — keeps the
 * cron infrastructure separate from business logic, so the use case can be
 * tested in isolation (no `@nestjs/schedule` involvement).
 *
 * @remarks
 * - `timeZone: 'UTC'` is pinned explicitly because the rest of the system
 *   stores timestamps in UTC. Leaving the default lets the server TZ leak
 *   into when the sweep fires.
 * - An in-process `isRunning` guard prevents overlap if a single sweep ever
 *   exceeds the 15-minute cadence. It is *not* a distributed lock — if
 *   multiple replicas run this app, each replica gets its own flag and they
 *   can still sweep in parallel. Defense in depth: the entity state machine
 *   rejects re-cancelling an already-cancelled row, so the worst case is
 *   wasted DB reads, not corruption. A distributed lock is post-MVP.
 *
 * Registered globally via `ScheduleModule.forRoot()` in {@link AppModule}.
 * Set `DISABLE_CRON=true` in env to keep this from firing during local dev.
 */
@Injectable()
export class AutoCancelTripInstancesCron {
  private readonly logger = new Logger(AutoCancelTripInstancesCron.name);
  private isRunning = false;

  constructor(private readonly useCase: CancelExpiredTripInstancesUseCase) {}

  @Cron('*/15 * * * *', {
    name: 'auto-cancel-trip-instances',
    timeZone: 'UTC',
  })
  async handle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        '[AutoCancel] previous sweep still in progress — skipping this tick',
      );
      return;
    }

    this.isRunning = true;
    try {
      await this.useCase.execute();
    } catch (err) {
      // Use-case already logs per-instance failures; catch here only protects
      // the scheduler against an unexpected top-level error (e.g. DB down).
      this.logger.error(
        `[AutoCancel] sweep aborted: ${(err as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
