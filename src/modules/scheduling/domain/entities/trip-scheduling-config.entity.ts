import { CronExpressionParser } from 'cron-parser';
import {
  InvalidSchedulingCronError,
  InvalidSchedulingDaysAheadError,
} from './errors/trip-scheduling-config.errors';

const DAYS_AHEAD_MIN = 1;
const DAYS_AHEAD_MAX = 90;
const DEFAULT_DAYS_AHEAD = 14;
const DEFAULT_GENERATION_CRON = '0 2 * * *';
const DEFAULT_AUTO_CANCEL_CRON = '*/15 * * * *';

/** Input shape for {@link TripSchedulingConfig}. Optional fields take defaults. */
export interface TripSchedulingConfigProps {
  readonly id: string;
  readonly organizationId: string;
  daysAhead?: number;
  generationCron?: string;
  autoCancelCron?: string;
  enabled?: boolean;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

interface TripSchedulingConfigState {
  readonly id: string;
  readonly organizationId: string;
  daysAhead: number;
  generationCron: string;
  autoCancelCron: string;
  enabled: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Per-organisation scheduling configuration for the trip generation and
 * auto-cancel cron jobs. One row per organisation; controls cadence and the
 * number of days the generator looks ahead.
 *
 * Defaults match the global cron registration so any organisation without an
 * explicit config behaves identically to the system default.
 */
export class TripSchedulingConfig {
  private readonly props: TripSchedulingConfigState;

  private constructor(props: TripSchedulingConfigState) {
    this.props = props;
  }

  /**
   * Creates a new config with defaults, validating any overrides supplied.
   */
  static create(input: {
    id: string;
    organizationId: string;
    daysAhead?: number;
    generationCron?: string;
    autoCancelCron?: string;
    enabled?: boolean;
  }): TripSchedulingConfig {
    const daysAhead = input.daysAhead ?? DEFAULT_DAYS_AHEAD;
    const generationCron = input.generationCron ?? DEFAULT_GENERATION_CRON;
    const autoCancelCron = input.autoCancelCron ?? DEFAULT_AUTO_CANCEL_CRON;

    TripSchedulingConfig.validateDaysAhead(daysAhead);
    TripSchedulingConfig.validateCron('generationCron', generationCron);
    TripSchedulingConfig.validateCron('autoCancelCron', autoCancelCron);

    const now = new Date();
    return new TripSchedulingConfig({
      id: input.id,
      organizationId: input.organizationId,
      daysAhead,
      generationCron,
      autoCancelCron,
      enabled: input.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Restores an instance from persistence without re-validating invariants.
   * Intended only for {@link TripSchedulingConfigMapper}.
   */
  static restore(props: TripSchedulingConfigProps): TripSchedulingConfig {
    const now = new Date();
    return new TripSchedulingConfig({
      id: props.id,
      organizationId: props.organizationId,
      daysAhead: props.daysAhead ?? DEFAULT_DAYS_AHEAD,
      generationCron: props.generationCron ?? DEFAULT_GENERATION_CRON,
      autoCancelCron: props.autoCancelCron ?? DEFAULT_AUTO_CANCEL_CRON,
      enabled: props.enabled ?? true,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  private static validateDaysAhead(value: number): void {
    if (
      !Number.isInteger(value) ||
      value < DAYS_AHEAD_MIN ||
      value > DAYS_AHEAD_MAX
    ) {
      throw new InvalidSchedulingDaysAheadError(value);
    }
  }

  private static validateCron(field: string, expression: string): void {
    try {
      CronExpressionParser.parse(expression);
    } catch {
      throw new InvalidSchedulingCronError(field, expression);
    }
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get daysAhead(): number {
    return this.props.daysAhead;
  }
  get generationCron(): string {
    return this.props.generationCron;
  }
  get autoCancelCron(): string {
    return this.props.autoCancelCron;
  }
  get enabled(): boolean {
    return this.props.enabled;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** @throws {@link InvalidSchedulingDaysAheadError} */
  updateDaysAhead(value: number): void {
    TripSchedulingConfig.validateDaysAhead(value);
    this.props.daysAhead = value;
    this.props.updatedAt = new Date();
  }

  /**
   * Replaces one or both cron expressions, validating each non-undefined entry.
   * @throws {@link InvalidSchedulingCronError}
   */
  updateCrons(generation?: string, autoCancel?: string): void {
    if (generation !== undefined) {
      TripSchedulingConfig.validateCron('generationCron', generation);
      this.props.generationCron = generation;
    }
    if (autoCancel !== undefined) {
      TripSchedulingConfig.validateCron('autoCancelCron', autoCancel);
      this.props.autoCancelCron = autoCancel;
    }
    this.props.updatedAt = new Date();
  }

  setEnabled(value: boolean): void {
    this.props.enabled = value;
    this.props.updatedAt = new Date();
  }
}
