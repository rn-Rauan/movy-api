import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import { TripSchedulingConfigRepository } from 'src/modules/scheduling/domain/interfaces';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import { MonthlyTripLimitExceededError } from 'src/modules/subscriptions/domain/errors/subscription.errors';
import { TripInstance, TripTemplate } from '../../domain/entities';
import {
  InvalidTripTemplateMissingCapacityError,
  InvalidTripTemplateMissingScheduleError,
} from '../../domain/entities/errors/trip-template.errors';
import {
  DayOfWeek,
  TripInstanceRepository,
  TripStatus,
  TripTemplateRepository,
} from '../../domain/interfaces';
import {
  arrivalCrossesMidnight,
  combineDateAndTime,
} from '../../domain/utils/combine-date-and-time';

/** Result aggregate returned by {@link GenerateRecurringTripInstancesUseCase.execute}. */
export interface GenerateRecurringTripInstancesResult {
  created: number;
  skipped: number;
  failed: number;
}

/**
 * Per-template result used by {@link GenerateRecurringTripInstancesUseCase.processTemplate}.
 * Includes the updated `monthlyCount` (so the caller's running tally stays accurate)
 * and a `planLimitHit` signal so the org-level loop knows to halt the remaining
 * templates cleanly.
 */
export interface ProcessTemplateResult {
  created: number;
  skipped: number;
  failed: number;
  monthlyCount: number;
  planLimitHit: boolean;
}

const UTC_DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const PRISMA_UNIQUE_VIOLATION = 'P2002';

/**
 * Generates a rolling window of `TripInstance` rows for every active recurring
 * `TripTemplate` across every active organisation. Invoked by the daily
 * generation cron at `0 2 * * *` UTC.
 *
 * **Algorithm** (per organisation):
 * 1. Read its `TripSchedulingConfig` (defaults applied if absent) and skip
 *    if `enabled = false`.
 * 2. For each active recurring template, iterate the
 *    `[today, today + daysAhead)` UTC window. For each day matching
 *    `template.frequency`:
 *    - skip if `departureTime` is already in the past (cron started late or
 *      template's time-of-day is earlier than the cron run);
 *    - skip if an instance already exists for that template + UTC day
 *      (idempotency, cheap DB call);
 *    - **only then** consult `PlanLimitService` — we don't burn plan-limit
 *      checks on days we wouldn't create anyway;
 *    - persist a new `TripInstance` snapshotted from the template.
 * 3. Per-instance failures are logged and counted; per-org failures (e.g.
 *    `NoActiveSubscriptionError`) are isolated so one broken org never poisons
 *    the rest of the sweep.
 *
 * **Race defence (multi-replica):** the in-memory `existsForTemplateOnDay`
 * check eliminates 99.9% of duplicates. The remaining race window — two
 * replicas both passing the pre-check before either has saved — is closed by
 * a DB-level `@@unique([tripTemplateId, departureTime])` constraint on
 * `trip_instance`. Unique-violation errors (`P2002`) bubble up from Prisma,
 * are detected here, and are counted as `skipped` rather than `failed`.
 */
@Injectable()
export class GenerateRecurringTripInstancesUseCase {
  private readonly logger = new Logger(
    GenerateRecurringTripInstancesUseCase.name,
  );

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly schedulingConfigRepository: TripSchedulingConfigRepository,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async execute(): Promise<GenerateRecurringTripInstancesResult> {
    const now = new Date();
    const organizations =
      await this.organizationRepository.findAllActiveUnpaginated();

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const org of organizations) {
      try {
        const orgResult = await this.processOrganization(org.id, now);
        created += orgResult.created;
        skipped += orgResult.skipped;
        failed += orgResult.failed;
      } catch (err) {
        // One broken org (no active subscription, plan deleted, DB hiccup
        // outside per-instance try blocks) must not halt the sweep for the rest.
        failed++;
        this.logger.error(
          `[GenerateRecurring] org=${org.id} aborted unexpectedly: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[GenerateRecurring] sweep complete: created=${created}, skipped=${skipped}, failed=${failed}`,
    );
    return { created, skipped, failed };
  }

  private async processOrganization(
    organizationId: string,
    now: Date,
  ): Promise<GenerateRecurringTripInstancesResult> {
    const config =
      await this.schedulingConfigRepository.findByOrganizationId(
        organizationId,
      );

    if (config && !config.enabled) {
      return { created: 0, skipped: 0, failed: 0 };
    }

    const daysAhead = config?.daysAhead ?? 14;

    const templates =
      await this.tripTemplateRepository.findActiveRecurringByOrganizationId(
        organizationId,
      );

    if (templates.length === 0) {
      return { created: 0, skipped: 0, failed: 0 };
    }

    const periodStart =
      await this.planLimitService.getCurrentPeriodStart(organizationId);
    let monthlyCount =
      await this.tripInstanceRepository.countByOrganizationInPeriod(
        organizationId,
        periodStart,
        now,
      );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const template of templates) {
      const result = await this.processTemplate(
        template,
        organizationId,
        daysAhead,
        now,
        monthlyCount,
      );
      created += result.created;
      skipped += result.skipped;
      failed += result.failed;
      monthlyCount = result.monthlyCount;

      if (result.planLimitHit) {
        return { created, skipped, failed };
      }
    }

    return { created, skipped, failed };
  }

  /**
   * Runs the per-template inner loop: iterates `[today, today + daysAhead)` in
   * UTC and applies the same generation pipeline used by the recurring cron
   * (defensive validation → past skip → idempotency → plan limit → save with
   * unique-race tolerance).
   *
   * Exposed publicly so {@link GenerateTripInstancesForTemplateUseCase} can
   * reuse the exact same logic for the admin-triggered manual endpoint —
   * keeping the cron path and the manual path identical.
   *
   * Caller is responsible for validating that the template belongs to the
   * organisation and is in a generatable state (active, recurring, scheduled,
   * with `defaultCapacity`). This method only enforces the per-day mechanics.
   *
   * @returns Per-template counters plus the updated `monthlyCount` (so the
   *          caller's running tally stays accurate) and a `planLimitHit`
   *          signal that lets the caller break early.
   */
  async processTemplate(
    template: TripTemplate,
    organizationId: string,
    daysAhead: number,
    now: Date,
    monthlyCount: number,
  ): Promise<ProcessTemplateResult> {
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let offset = 0; offset < daysAhead; offset++) {
      const dateISO = this.computeDateISO(now, offset);

      if (!template.frequency.includes(this.computeDayOfWeek(dateISO))) {
        continue;
      }

      // Defensive: legacy templates without scheduling fields should already
      // be purged by migration 20260517100000, but we still log + count if
      // any slip through (manual DB edits, partial restores).
      if (!template.departureTimeOfDay || !template.arrivalTimeOfDay) {
        failed++;
        this.logger.error(
          `[GenerateRecurring] template=${template.id} missing schedule — skipping`,
        );
        break; // every day for this template would fail the same way
      }
      if (!template.defaultCapacity) {
        failed++;
        this.logger.error(
          `[GenerateRecurring] template=${template.id} missing defaultCapacity — skipping`,
        );
        break;
      }

      const departureTime = combineDateAndTime(
        dateISO,
        template.departureTimeOfDay,
      );

      // Don't generate trips whose departure is already in the past.
      // Admin can create those manually if a backfill is needed.
      if (departureTime.getTime() < now.getTime()) {
        skipped++;
        continue;
      }

      // Idempotency check first — cheapest signal and the most common skip
      // path. Avoids paying for a plan-limit check on a no-op day.
      const { dayStart, dayEnd } = this.computeDayWindow(dateISO);
      const alreadyExists =
        await this.tripInstanceRepository.existsForTemplateOnDay(
          template.id,
          dayStart,
          dayEnd,
        );
      if (alreadyExists) {
        skipped++;
        continue;
      }

      // Plan-limit check only when we'd actually create.
      try {
        await this.planLimitService.assertMonthlyTripLimit(
          organizationId,
          monthlyCount,
        );
      } catch (err) {
        if (err instanceof MonthlyTripLimitExceededError) {
          this.logger.warn(
            `[GenerateRecurring] org=${organizationId} hit monthly plan limit — halting template window`,
          );
          return {
            created,
            skipped,
            failed,
            monthlyCount,
            planLimitHit: true,
          };
        }
        throw err; // bubble to processOrganization → execute() org-level catch
      }

      try {
        const saved = await this.persistInstance(
          template,
          dateISO,
          departureTime,
          organizationId,
        );
        if (saved) {
          created++;
          monthlyCount++;
        } else {
          skipped++;
        }
      } catch (err) {
        if (this.isUniqueViolation(err)) {
          // Another replica beat us to it between existsForTemplateOnDay and save.
          // The row exists now → not a failure, just a no-op.
          skipped++;
          this.logger.debug(
            `[GenerateRecurring] template=${template.id} date=${dateISO} lost the insert race — already created by another replica`,
          );
          continue;
        }
        failed++;
        this.logger.error(
          `[GenerateRecurring] template=${template.id} date=${dateISO} org=${organizationId}: ${(err as Error).message}`,
        );
      }
    }

    return { created, skipped, failed, monthlyCount, planLimitHit: false };
  }

  /**
   * Builds and persists a new {@link TripInstance} snapshotted from the
   * template. Caller has already verified the template has all required
   * fields and that no instance exists yet for this (template, day).
   */
  private async persistInstance(
    template: TripTemplate,
    dateISO: string,
    departureTime: Date,
    organizationId: string,
  ): Promise<TripInstance | null> {
    // Re-assert non-null fields for the type checker — caller has validated.
    if (!template.departureTimeOfDay || !template.arrivalTimeOfDay) {
      throw new InvalidTripTemplateMissingScheduleError(template.id);
    }
    if (!template.defaultCapacity) {
      throw new InvalidTripTemplateMissingCapacityError(template.id);
    }

    const crossesMidnight = arrivalCrossesMidnight(
      template.departureTimeOfDay,
      template.arrivalTimeOfDay,
    );
    const arrivalEstimate = combineDateAndTime(
      dateISO,
      template.arrivalTimeOfDay,
      crossesMidnight,
    );

    const autoCancelAt =
      template.autoCancelEnabled && template.autoCancelOffset !== null
        ? new Date(departureTime.getTime() - template.autoCancelOffset * 60_000)
        : null;

    const minRevenue = template.autoCancelEnabled ? template.minRevenue : null;

    const instance = TripInstance.create({
      id: randomUUID(),
      organizationId,
      tripTemplateId: template.id,
      driverId: null,
      vehicleId: null,
      totalCapacity: template.defaultCapacity,
      isPublic: template.isPublic,
      departureTime,
      arrivalEstimate,
      minRevenue,
      autoCancelAt,
    });

    // When the template has BOTH default driver and vehicle, skip the manual
    // assignment step admins used to forget — assign the defaults and promote
    // the instance from DRAFT to SCHEDULED so it becomes visible to passengers
    // immediately. Partial defaults (only one side) keep DRAFT semantics: the
    // admin can still pick a different driver/vehicle for this specific date.
    if (template.defaultDriverId && template.defaultVehicleId) {
      instance.assignDriver(template.defaultDriverId);
      instance.assignVehicle(template.defaultVehicleId);
      instance.transitionTo(TripStatus.SCHEDULED);
    }

    return this.tripInstanceRepository.save(instance);
  }

  /**
   * True when an error looks like a Prisma unique-constraint violation (P2002).
   * Uses duck typing on `.code` to avoid pulling the Prisma runtime into the
   * domain/application layer (and to keep unit tests free of runtime imports).
   */
  private isUniqueViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === PRISMA_UNIQUE_VIOLATION
    );
  }

  /** Returns YYYY-MM-DD (UTC) for `now + offsetDays`. */
  private computeDateISO(now: Date, offsetDays: number): string {
    const target = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offsetDays,
      ),
    );
    const yyyy = target.getUTCFullYear();
    const mm = String(target.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(target.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Maps YYYY-MM-DD to the {@link DayOfWeek} for that date in UTC. */
  private computeDayOfWeek(dateISO: string): DayOfWeek {
    const [y, m, d] = dateISO.split('-').map(Number);
    const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return UTC_DAY_ORDER[utcDay];
  }

  /** Returns inclusive [00:00:00, 23:59:59.999] UTC bounds for the given YYYY-MM-DD. */
  private computeDayWindow(dateISO: string): { dayStart: Date; dayEnd: Date } {
    const [y, m, d] = dateISO.split('-').map(Number);
    const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    return { dayStart, dayEnd };
  }
}
