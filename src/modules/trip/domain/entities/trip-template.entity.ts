import { Money } from 'src/shared/domain/entities/value-objects';
import { RequiredFieldError } from 'src/shared/domain/errors';
import type { Status } from 'src/shared/domain/types';
import { DayOfWeek, Shift } from '../interfaces';
import {
  InvalidTripAutoCancelConfigurationError,
  InvalidTripFrequencyError,
  InvalidTripPriceConfigurationError,
  InvalidTripRoutePointsError,
  InvalidTripStopsError,
} from './errors/trip-template.errors';

/**
 * Input shape for TripTemplate — optional fields receive domain defaults.
 * Passed to both `create()` and `restore()`.
 */
export interface TripTemplateProps {
  readonly id: string;
  readonly organizationId: string;
  departurePoint: string;
  destination: string;
  frequency: DayOfWeek[];
  stops: string[];
  priceOneWay?: Money | null;
  priceReturn?: Money | null;
  priceRoundTrip?: Money | null;
  isPublic?: boolean;
  isRecurring?: boolean;
  autoCancelEnabled?: boolean;
  minRevenue?: Money | null;
  autoCancelOffset?: number | null;
  status?: Status;
  shift: Shift;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @internal Resolved internal state — all fields are non-optional after construction.
 */
interface TripTemplateState {
  readonly id: string;
  readonly organizationId: string;
  departurePoint: string;
  destination: string;
  frequency: DayOfWeek[];
  stops: string[];
  priceOneWay: Money | null;
  priceReturn: Money | null;
  priceRoundTrip: Money | null;
  isPublic: boolean;
  isRecurring: boolean;
  autoCancelEnabled: boolean;
  minRevenue: Money | null;
  autoCancelOffset: number | null;
  status: Status;
  shift: Shift;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate root representing a reusable route/schedule blueprint for trips.
 *
 * A `TripTemplate` defines the static configuration shared across multiple
 * {@link TripInstance} executions: route points, stops, pricing tiers, recurrence
 * frequency, shift classification, and auto-cancel rules.
 *
 * Invariants enforced at creation time:
 * - `departurePoint` and `destination` must be non-empty and distinct
 * - `stops` must contain at least 2 valid (non-empty) items
 * - At least one price tier (`priceOneWay`, `priceReturn`, `priceRoundTrip`) must be set
 * - A recurring template must define at least one `DayOfWeek` in `frequency`
 * - Auto-cancel requires both `minRevenue` and a positive `autoCancelOffset`
 *
 * @see TripInstance
 */
export class TripTemplate {
  private readonly props: TripTemplateState;

  private constructor(props: TripTemplateProps) {
    const now = new Date();

    this.props = {
      ...props,
      departurePoint: props.departurePoint.trim(),
      destination: props.destination.trim(),
      frequency: props.frequency ?? [],
      stops: props.stops.map((stop) => stop.trim()),
      priceOneWay: props.priceOneWay ?? null,
      priceReturn: props.priceReturn ?? null,
      priceRoundTrip: props.priceRoundTrip ?? null,
      isPublic: props.isPublic ?? false,
      isRecurring: props.isRecurring ?? false,
      autoCancelEnabled: props.autoCancelEnabled ?? false,
      minRevenue: props.autoCancelEnabled ? (props.minRevenue ?? null) : null,
      autoCancelOffset: props.autoCancelEnabled
        ? (props.autoCancelOffset ?? null)
        : null,
      status: props.status ?? 'ACTIVE',
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Creates a new `TripTemplate`, running all domain invariant checks.
   *
   * @param props - Template configuration (excludes `createdAt`, `updatedAt`, `status`)
   * @returns A new {@link TripTemplate} with `status = ACTIVE`
   * @throws {@link RequiredFieldError} if `departurePoint` or `destination` is empty
   * @throws {@link InvalidTripRoutePointsError} if both route points are equal
   * @throws {@link InvalidTripStopsError} if `stops` has fewer than 2 valid items
   * @throws {@link InvalidTripPriceConfigurationError} if no price tier is provided
   * @throws {@link InvalidTripFrequencyError} if recurring but `frequency` is empty
   * @throws {@link InvalidTripAutoCancelConfigurationError} if auto-cancel config is incomplete
   */
  static create(
    props: Omit<TripTemplateProps, 'createdAt' | 'updatedAt' | 'status'>,
  ): TripTemplate {
    TripTemplate.validateRoute(props.departurePoint, props.destination);
    TripTemplate.validateStops(props.stops);
    TripTemplate.validatePricing(
      props.priceOneWay ?? null,
      props.priceReturn ?? null,
      props.priceRoundTrip ?? null,
    );
    TripTemplate.validateRecurrence(
      props.isRecurring ?? false,
      props.frequency,
    );
    TripTemplate.validateAutoCancel(
      props.autoCancelEnabled ?? false,
      props.minRevenue ?? null,
      props.autoCancelOffset ?? null,
    );

    return new TripTemplate(props);
  }

  /**
   * Restores a `TripTemplate` from persistence without re-running invariant checks.
   *
   * @remarks Should only be called from {@link TripTemplateMapper}.
   * @param props - Raw props as stored in the database
   * @returns A fully hydrated {@link TripTemplate}
   */
  static restore(props: TripTemplateProps): TripTemplate {
    return new TripTemplate(props);
  }

  /** Validates that both route points are non-empty and distinct */
  private static validateRoute(
    departurePoint: string,
    destination: string,
  ): void {
    if (!departurePoint.trim()) {
      throw new RequiredFieldError('departurePoint');
    }

    if (!destination.trim()) {
      throw new RequiredFieldError('destination');
    }

    if (departurePoint.trim() === destination.trim()) {
      throw new InvalidTripRoutePointsError();
    }
  }

  /** Validates that the stops array has at least 2 non-empty items */
  private static validateStops(stops: string[]): void {
    if (!Array.isArray(stops) || stops.length < 2) {
      throw new InvalidTripStopsError();
    }

    const hasInvalidStop = stops.some((stop) => !stop.trim());

    if (hasInvalidStop) {
      throw new InvalidTripStopsError();
    }
  }

  /** Validates that at least one enrollment type price is provided */
  private static validatePricing(
    priceOneWay: Money | null,
    priceReturn: Money | null,
    priceRoundTrip: Money | null,
  ): void {
    if (!priceOneWay && !priceReturn && !priceRoundTrip) {
      throw new InvalidTripPriceConfigurationError();
    }
  }

  /** Validates that a recurring template defines at least one day of week */
  private static validateRecurrence(
    isRecurring: boolean,
    frequency: DayOfWeek[],
  ): void {
    if (isRecurring && (!frequency || frequency.length === 0)) {
      throw new InvalidTripFrequencyError();
    }
  }

  /** Validates that auto-cancel fields are present and valid when the feature is enabled */
  private static validateAutoCancel(
    autoCancelEnabled: boolean,
    minRevenue: Money | null,
    autoCancelOffset: number | null,
  ): void {
    if (!autoCancelEnabled) {
      return;
    }

    if (!minRevenue) {
      throw new InvalidTripAutoCancelConfigurationError(
        'minRevenue is required when auto-cancel is enabled',
      );
    }

    if (
      autoCancelOffset === null ||
      !Number.isInteger(autoCancelOffset) ||
      autoCancelOffset <= 0
    ) {
      throw new InvalidTripAutoCancelConfigurationError(
        'autoCancelOffset must be a positive integer when auto-cancel is enabled',
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get departurePoint(): string {
    return this.props.departurePoint;
  }

  get destination(): string {
    return this.props.destination;
  }

  get frequency(): DayOfWeek[] {
    return this.props.frequency;
  }

  get stops(): string[] {
    return [...this.props.stops];
  }

  get priceOneWay(): Money | null {
    return this.props.priceOneWay;
  }

  get priceReturn(): Money | null {
    return this.props.priceReturn;
  }

  get priceRoundTrip(): Money | null {
    return this.props.priceRoundTrip;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  get autoCancelEnabled(): boolean {
    return this.props.autoCancelEnabled;
  }

  get minRevenue(): Money | null {
    return this.props.minRevenue;
  }

  get autoCancelOffset(): number | null {
    return this.props.autoCancelOffset;
  }

  get status(): Status {
    return this.props.status;
  }

  get shift(): Shift {
    return this.props.shift;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Activate the template, making it available for trip instance creation. */
  activate(): void {
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  /** Deactivate the template, preventing new trip instances from being created. */
  deactivate(): void {
    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  /** Returns true when the template is in active status. */
  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  /**
   * Update the route endpoints.
   * @throws RequiredFieldError if either point is empty
   * @throws InvalidTripRoutePointsError if both points are equal
   */
  updateRoute(departurePoint: string, destination: string): void {
    TripTemplate.validateRoute(departurePoint, destination);
    this.props.departurePoint = departurePoint.trim();
    this.props.destination = destination.trim();
    this.props.updatedAt = new Date();
  }

  /**
   * Replace the stops list.
   * @throws InvalidTripStopsError if fewer than 2 valid items
   */
  updateStops(stops: string[]): void {
    TripTemplate.validateStops(stops);
    this.props.stops = stops.map((stop) => stop.trim());
    this.props.updatedAt = new Date();
  }

  /**
   * Patch one or more enrollment type prices, keeping unchanged values.
   * @throws InvalidTripPriceConfigurationError if all prices end up null
   */
  updatePricing(prices: {
    priceOneWay?: Money | null;
    priceReturn?: Money | null;
    priceRoundTrip?: Money | null;
  }): void {
    const nextPriceOneWay = prices.priceOneWay ?? this.props.priceOneWay;
    const nextPriceReturn = prices.priceReturn ?? this.props.priceReturn;
    const nextPriceRoundTrip =
      prices.priceRoundTrip ?? this.props.priceRoundTrip;

    TripTemplate.validatePricing(
      nextPriceOneWay,
      nextPriceReturn,
      nextPriceRoundTrip,
    );

    this.props.priceOneWay = nextPriceOneWay;
    this.props.priceReturn = nextPriceReturn;
    this.props.priceRoundTrip = nextPriceRoundTrip;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle recurring mode and update the frequency days.
   * @throws InvalidTripFrequencyError if enabling recurrence with no days
   */
  setRecurrence(isRecurring: boolean, frequency: DayOfWeek[] = []): void {
    TripTemplate.validateRecurrence(isRecurring, frequency);
    this.props.isRecurring = isRecurring;
    this.props.frequency = frequency;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle auto-cancel and update its configuration.
   * When disabled, minRevenue and autoCancelOffset are forced to null.
   * @throws InvalidTripAutoCancelConfigurationError if enabling with incomplete config
   */
  setAutoCancel(
    autoCancelEnabled: boolean,
    minRevenue: Money | null = null,
    autoCancelOffset: number | null = null,
  ): void {
    TripTemplate.validateAutoCancel(
      autoCancelEnabled,
      minRevenue,
      autoCancelOffset,
    );

    this.props.autoCancelEnabled = autoCancelEnabled;
    this.props.minRevenue = autoCancelEnabled ? minRevenue : null;
    this.props.autoCancelOffset = autoCancelEnabled ? autoCancelOffset : null;
    this.props.updatedAt = new Date();
  }
}
