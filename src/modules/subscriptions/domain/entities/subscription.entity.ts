import { SubscriptionStatus } from '../interfaces/enums/subscription-status.enum';

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

export interface CreateSubscriptionProps {
  organizationId: string;
  planId: number;
  expiresAt: Date;
}

export class SubscriptionEntity {
  private readonly props: SubscriptionState;

  private constructor(props: SubscriptionState) {
    this.props = props;
  }

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

  static restore(props: SubscriptionState): SubscriptionEntity {
    return new SubscriptionEntity(props);
  }

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
