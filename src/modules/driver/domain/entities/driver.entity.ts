import { DriverStatus } from '../interfaces/enums/driver-status.enum';
import { Cnh, CnhCategory } from './value-objects';

/**
 * Interface that defines the properties of the Driver entity.
 */
export interface DriverProps {
  readonly id: string;
  userId: string;
  organizationId: string;
  cnh: Cnh;
  cnhCategory: CnhCategory;
  cnhExpiresAt: Date;
  readonly createdAt?: Date;
  updatedAt?: Date;
  driverStatus?: DriverStatus;
}

/**
 * Entity Driver
 *
 * Responsibility:
 * - Manage driver data
 * - Validate data integrity
 * - Encapsulate business rules
 */
export class DriverEntity {
  private readonly props: Required<DriverProps>;

  private constructor(props: DriverProps) {
    const now: Date = new Date();

    this.props = {
      ...props,
      driverStatus: props.driverStatus ?? DriverStatus.ACTIVE,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Method to create a new Driver instance.
   */
  static create(
    props: Omit<DriverProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): DriverEntity {
    return new DriverEntity(props);
  }

  /**
   * Method to restore an existing Driver instance.
   */
  static restore(props: DriverProps): DriverEntity {
    return new DriverEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get cnh(): Cnh {
    return this.props.cnh;
  }

  get cnhCategory(): CnhCategory {
    return this.props.cnhCategory;
  }

  get cnhExpiresAt(): Date {
    return this.props.cnhExpiresAt;
  }

  get driverStatus(): DriverStatus {
    return this.props.driverStatus;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if driver's CNH is expired
   */
  isExpired(): boolean {
    return new Date() > this.cnhExpiresAt;
  }

  /**
   * Get remaining days until CNH expiration
   */
  getCnhRemainingDays(): number {
    const now = new Date();
    const diffMs = this.cnhExpiresAt.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Activate driver
   */
  activate(): void {
    this.props.driverStatus = DriverStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate driver
   */
  deactivate(): void {
    this.props.driverStatus = DriverStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  /**
   * Suspend driver
   */
  suspend(): void {
    this.props.driverStatus = DriverStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  /**
   * Update CNH information
   */
  updateCnh(cnh: Cnh, category: CnhCategory, expiresAt: Date): void {
    this.props.cnh = cnh;
    this.props.cnhCategory = category;
    this.props.cnhExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }
}
