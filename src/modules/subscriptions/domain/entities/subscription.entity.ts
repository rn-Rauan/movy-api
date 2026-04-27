import { SubscriptionStatus } from '../interfaces/enums/subscription-status.enum';

/** @internal Internal state bag of a subscription entity. Fields without `readonly` can be mutated. */
interface SubscriptionState {
  readonly id: string;
  readonly organizationId: string;
  readonly planId: number;
  status: SubscriptionStatus;
  readonly startDate: Date;
  expiresAt: Date;
  readonly createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties required to create a new {@link SubscriptionEntity}.
 *
 * `expiresAt` must be calculated by the caller (use case); the entity itself
 * does not enforce the 30-day duration — that is `SubscribeToPlanUseCase`'s responsibility.
 */
export interface CreateSubscriptionProps {
  organizationId: string;
  planId: number;
  expiresAt: Date;
}

/**
 * Domain aggregate root representing an organisation's subscription to a plan.
 *
 * A subscription is always created with `status = ACTIVE` and a UUID generated
 * via `crypto.randomUUID()` in the domain layer. The `id` is therefore available
 * before any database interaction.
 *
 * @see SubscriptionStatus
 * @see CreateSubscriptionProps
 */
export class SubscriptionEntity {
  private readonly props: SubscriptionState;

  private constructor(props: SubscriptionState) {
    this.props = props;
  }

  /**
   * Creates a new subscription with `status = ACTIVE`, a UUID from `crypto.randomUUID()`,
   * and all timestamps set to **now**. `startDate` is always set to the creation instant.
   *
   * @param props - Initial values for the subscription (organizationId, planId, expiresAt)
   * @returns A new {@link SubscriptionEntity} ready to be persisted
   */
  static create(props: CreateSubscriptionProps): SubscriptionEntity {
    const now = new Date();
    return new SubscriptionEntity({
      id: crypto.randomUUID(),
      organizationId: props.organizationId,
      planId: props.planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      expiresAt: props.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstructs a subscription entity from a persisted database record.
   *
   * Intended for **exclusive** use by the infrastructure mapper.
   * Do not call this method from application or domain code.
   *
   * @param props - Complete state as returned by the database
   * @returns A {@link SubscriptionEntity} instance that mirrors the stored state
   */
  static restore(props: SubscriptionState): SubscriptionEntity {
    return new SubscriptionEntity(props);
  }

  /**
   * Cancels the subscription by setting `status = CANCELED` and refreshing `updatedAt`.
   *
   * @remarks
   * This method does not validate the current status before cancelling.
   * Guard logic (ensuring only ACTIVE subscriptions are cancelled) must be enforced
   * at the use-case layer.
   */
  cancel(): void {
    this.props.status = SubscriptionStatus.CANCELED;
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get planId(): number {
    return this.props.planId;
  }
  get status(): SubscriptionStatus {
    return this.props.status;
  }
  get startDate(): Date {
    return this.props.startDate;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
