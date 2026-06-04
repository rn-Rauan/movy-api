import { Injectable, Logger } from '@nestjs/common';
import { TripSchedulingConfigRepository } from 'src/modules/scheduling/domain/interfaces';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';
import {
  InvalidTripTemplateMissingCapacityError,
  InvalidTripTemplateMissingScheduleError,
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
  TripTemplateNotRecurringError,
} from '../../domain/entities/errors/trip-template.errors';
import {
  TripInstanceRepository,
  TripTemplateRepository,
} from '../../domain/interfaces';
import {
  GenerateRecurringTripInstancesResult,
  GenerateRecurringTripInstancesUseCase,
} from './generate-recurring-trip-instances.use-case';

const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 90;
const DEFAULT_DAYS_AHEAD = 14;

/**
 * Admin-triggered, single-template counterpart to the daily generation cron.
 *
 * Use cases:
 * - Backfill the upcoming window for a newly created recurring template
 *   without waiting for the next 02:00 UTC tick.
 * - Re-run the window after cron downtime.
 * - Demo / sanity-check from the admin UI.
 *
 * The actual per-day generation pipeline (defensive validation → past skip →
 * idempotency → plan limit → save with unique-race tolerance) is delegated
 * to {@link GenerateRecurringTripInstancesUseCase.processTemplate}, so the
 * manual path and the cron path stay byte-for-byte identical. This method
 * handles only the admin-specific concerns: ownership check, recurring-state
 * gate, and `daysAhead` resolution.
 */
@Injectable()
export class GenerateTripInstancesForTemplateUseCase {
  private readonly logger = new Logger(
    GenerateTripInstancesForTemplateUseCase.name,
  );

  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly schedulingConfigRepository: TripSchedulingConfigRepository,
    private readonly generateRecurringUseCase: GenerateRecurringTripInstancesUseCase,
    private readonly planLimitService: PlanLimitService,
  ) {}

  /**
   * @param templateId - UUID of the trip template to generate from
   * @param organizationId - UUID of the calling organisation (from JWT)
   * @param daysAheadOverride - Optional override; falls back to the org's
   *        scheduling config, then to the global default of 14
   * @throws {@link TripTemplateNotFoundError} when the template doesn't exist
   * @throws {@link TripTemplateAccessForbiddenError} when the template belongs
   *         to a different organisation
   * @throws {@link TripTemplateInactiveError} when the template is inactive
   * @throws {@link TripTemplateNotRecurringError} when `isRecurring=false`
   *         or `frequency` is empty
   * @throws {@link InvalidTripTemplateMissingScheduleError} for legacy rows
   *         without `departureTimeOfDay` / `arrivalTimeOfDay`
   * @throws {@link InvalidTripTemplateMissingCapacityError} for legacy rows
   *         without `defaultCapacity`
   */
  async execute(
    templateId: string,
    organizationId: string,
    daysAheadOverride?: number,
  ): Promise<GenerateRecurringTripInstancesResult> {
    const template = await this.tripTemplateRepository.findById(templateId);

    if (!template) {
      throw new TripTemplateNotFoundError(templateId);
    }

    if (template.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(templateId);
    }

    if (!template.isActive()) {
      throw new TripTemplateInactiveError(templateId);
    }

    if (!template.isRecurring || template.frequency.length === 0) {
      throw new TripTemplateNotRecurringError(templateId);
    }

    // Surface the legacy-row guardrails as proper errors (the cron path treats
    // these as per-template failures, but the manual endpoint owes the admin
    // a clear 400 response so they can fix the template).
    if (!template.departureTimeOfDay || !template.arrivalTimeOfDay) {
      throw new InvalidTripTemplateMissingScheduleError(templateId);
    }
    if (!template.defaultCapacity) {
      throw new InvalidTripTemplateMissingCapacityError(templateId);
    }

    const now = new Date();
    const daysAhead = await this.resolveDaysAhead(
      organizationId,
      daysAheadOverride,
    );

    const { start: periodStart, end: periodEnd } =
      await this.planLimitService.getCurrentPeriod(organizationId);
    const monthlyCount =
      await this.tripInstanceRepository.countByOrganizationInPeriod(
        organizationId,
        periodStart,
        periodEnd,
      );

    const result = await this.generateRecurringUseCase.processTemplate(
      template,
      organizationId,
      daysAhead,
      now,
      monthlyCount,
    );

    this.logger.log(
      `[GenerateManual] template=${templateId} org=${organizationId} ` +
        `daysAhead=${daysAhead} → created=${result.created}, skipped=${result.skipped}, failed=${result.failed}` +
        (result.planLimitHit ? ' (halted by plan limit)' : ''),
    );

    return {
      created: result.created,
      skipped: result.skipped,
      failed: result.failed,
    };
  }

  /**
   * Resolves the `daysAhead` window: explicit override (validated) →
   * org scheduling config → global default. Validation matches the
   * `TripSchedulingConfig` entity bounds (1..90 integer) so both paths
   * stay consistent.
   */
  private async resolveDaysAhead(
    organizationId: string,
    override: number | undefined,
  ): Promise<number> {
    if (override !== undefined) {
      if (
        !Number.isInteger(override) ||
        override < MIN_DAYS_AHEAD ||
        override > MAX_DAYS_AHEAD
      ) {
        // DTO-level validation should already reject this; keep a domain-side
        // assertion to catch programmatic callers that bypass class-validator.
        throw new RangeError(
          `daysAhead must be an integer between ${MIN_DAYS_AHEAD} and ${MAX_DAYS_AHEAD}`,
        );
      }
      return override;
    }

    const config =
      await this.schedulingConfigRepository.findByOrganizationId(
        organizationId,
      );
    return config?.daysAhead ?? DEFAULT_DAYS_AHEAD;
  }
}
