import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GenerateRecurringTripInstancesUseCase } from '../../application/use-cases/generate-recurring-trip-instances.use-case';

/**
 * Scheduled job that fires daily at 02:00 UTC and generates a rolling window
 * of TripInstance rows for every active recurring TripTemplate.
 *
 * Thin wrapper around {@link GenerateRecurringTripInstancesUseCase} — keeps the
 * cron infrastructure separate from business logic, so the use case can be
 * tested in isolation (no `@nestjs/schedule` involvement).
 *
 * @remarks
 * - `timeZone: 'UTC'` is pinned explicitly because the rest of the system stores
 *   timestamps in UTC; leaving the default would let the server TZ leak into
 *   when the sweep fires.
 * - An in-process `isRunning` guard prevents overlap if a sweep ever runs past
 *   the next tick (the daily cadence makes this unlikely, but guard cheaply).
 *   It is *not* a distributed lock — if the app is replicated, each replica
 *   gets its own flag. Defense in depth: the per-(template, day) idempotency
 *   check in the use-case keeps duplicates out of the database.
 *
 * Registered globally via `ScheduleModule.forRoot()` in {@link AppModule}.
 * Set `DISABLE_CRON=true` in env to keep this from firing during local dev.
 */
@Injectable()
export class GenerateRecurringTripInstancesCron {
  private readonly logger = new Logger(GenerateRecurringTripInstancesCron.name);
  private isRunning = false;

  constructor(
    private readonly useCase: GenerateRecurringTripInstancesUseCase,
  ) {}

  @Cron('0 2 * * *', {
    name: 'generate-recurring-trip-instances',
    timeZone: 'UTC',
  })
  async handle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        '[GenerateRecurring] previous sweep still in progress — skipping this tick',
      );
      return;
    }

    this.isRunning = true;
    try {
      await this.useCase.execute();
    } catch (err) {
      // Use-case already logs per-template/day failures; catch here only protects
      // the scheduler against an unexpected top-level error (e.g. DB down).
      this.logger.error(
        `[GenerateRecurring] sweep aborted: ${(err as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
