/** @internal */
export interface MembershipProps {
  readonly userId: string;
  readonly roleId: number;
  readonly organizationId: string;
  readonly assignedAt?: Date;
  removedAt?: Date | null;
}

/**
 * Aggregate representing a user's role assignment within an organization.
 *
 * @remarks
 * The composite key `(userId, roleId, organizationId)` is unique in the database.
 * Memberships support soft-removal: calling `remove()` stamps `removedAt`;
 * calling `restoreMembership()` clears it.
 * Used as the source of truth for RBAC token population via
 * `MembershipRepository.findFirstActiveByUserId`.
 *
 * @see {@link MembershipRepository} for persistence operations
 */
export class Membership {
  private readonly props: Required<MembershipProps>;

  private constructor(props: MembershipProps) {
    const now: Date = new Date();

    this.props = {
      ...props,
      assignedAt: props.assignedAt ?? now,
      removedAt: props.removedAt ?? null,
    };
  }

  /**
   * Creates a new membership with default `assignedAt = now` and `removedAt = null`.
   *
   * @param props - Membership properties (omits `assignedAt` and `removedAt`)
   * @returns A new {@link Membership} instance
   */
  static create(
    props: Omit<MembershipProps, 'assignedAt' | 'removedAt'>,
  ): Membership {
    return new Membership(props);
  }

  /**
   * Restores a membership from persisted data (skips default assignment).
   *
   * @param props - Full membership properties from storage
   * @returns A hydrated {@link Membership} instance
   */
  static restore(props: MembershipProps): Membership {
    return new Membership(props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get roleId(): number {
    return this.props.roleId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get removedAt(): Date | null {
    return this.props.removedAt;
  }

  remove(): void {
    this.props.removedAt = new Date();
  }

  restoreMembership(): void {
    this.props.removedAt = null;
  }
}
