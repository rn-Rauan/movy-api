/**
 * Interface that defines the properties of the Membership entity.
 */
export interface MembershipProps {
  readonly userId: string;
  readonly roleId: number;
  readonly organizationId: string;
  readonly assignedAt?: Date;
  removedAt?: Date | null;
}

/**
 * Entity Membership (OrganizationMembership)
 *
 * Responsibility:
 * - Manage membership data between User, Role and Organization
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
   * Method to create a new Membership instance.
   */
  static create(
    props: Omit<MembershipProps, 'assignedAt' | 'removedAt'>,
  ): Membership {
    return new Membership(props);
  }

  /**
   * Method to restore an existing Membership instance.
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
