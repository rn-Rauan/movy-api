import { DriverStatus } from '../interfaces/enums/driver-status.enum';
import { Cnh, CnhCategory } from './value-objects';

/** @internal */
export interface DriverProps {
  readonly id: string;
  userId: string;
  cnh: Cnh;
  cnhCategory: CnhCategory;
  cnhExpiresAt: Date;
  readonly createdAt?: Date;
  updatedAt?: Date;
  driverStatus?: DriverStatus;
}

/**
 * Aggregate root representing a driver profile linked to a {@link User}.
 *
 * @remarks
 * A driver is always associated with exactly one user (`userId`).
 * CNH fields (`cnh`, `cnhCategory`, `cnhExpiresAt`) can only be updated
 * atomically — partial updates throw {@link PartialCnhUpdateError}.
 * Status transitions: `ACTIVE` → `INACTIVE` | `SUSPENDED`.
 *
 * @see {@link DriverRepository} for persistence operations
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
   * Creates a new driver profile with default `ACTIVE` status.
   *
   * @param props - Driver properties (omits `createdAt`, `updatedAt`)
   * @returns A new {@link DriverEntity} instance
   */
  static create(
    props: Omit<DriverProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): DriverEntity {
    return new DriverEntity(props);
  }

  /**
   * Restores a driver from persisted data (skips default assignment).
   *
   * @param props - Full driver properties from storage
   * @returns A hydrated {@link DriverEntity} instance
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
