import { InvalidSchedulingDaysAheadError } from './errors/trip-scheduling-config.errors';

const DAYS_AHEAD_MIN = 1;
const DAYS_AHEAD_MAX = 90;
const DEFAULT_DAYS_AHEAD = 14;

/** Input shape for {@link TripSchedulingConfig}. Optional fields take defaults. */
export interface TripSchedulingConfigProps {
  readonly id: string;
  readonly organizationId: string;
  daysAhead?: number;
  enabled?: boolean;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

interface TripSchedulingConfigState {
  readonly id: string;
  readonly organizationId: string;
  daysAhead: number;
  enabled: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Per-organisation scheduling configuration for the trip generation and
 * auto-cancel cron jobs. One row per organisation; controls the rolling window
 * size (`daysAhead`) and whether jobs run at all (`enabled`).
 *
 * Cron cadence itself is fixed globally — `generate-recurring-trip-instances`
 * fires at `0 2 * * *` UTC and `auto-cancel-trip-instances` every 15 minutes
 * UTC. Per-org cron overrides were considered but dropped: NestJS `@Cron()`
 * resolves at module load, so honouring a per-row override would require a
 * dynamic `SchedulerRegistry` setup that was out of scope.
 */
export class TripSchedulingConfig {
  private readonly props: TripSchedulingConfigState;

  private constructor(props: TripSchedulingConfigState) {
    this.props = props;
  }

  static create(input: {
    id: string;
    organizationId: string;
    daysAhead?: number;
    enabled?: boolean;
  }): TripSchedulingConfig {
    const daysAhead = input.daysAhead ?? DEFAULT_DAYS_AHEAD;

    TripSchedulingConfig.validateDaysAhead(daysAhead);

    const now = new Date();
    return new TripSchedulingConfig({
      id: input.id,
      organizationId: input.organizationId,
      daysAhead,
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

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get daysAhead(): number {
    return this.props.daysAhead;
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

  setEnabled(value: boolean): void {
    this.props.enabled = value;
    this.props.updatedAt = new Date();
  }
}
