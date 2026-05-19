import { DriverStatus } from '../interfaces/enums/driver-status.enum';
import { Cnh, CnhCategories } from './value-objects';

/** @internal */
export interface DriverProps {
  readonly id: string;
  userId: string;
  cnh: Cnh;
  cnhCategories: CnhCategories;
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
 * CNH fields (`cnh`, `cnhCategories`, `cnhExpiresAt`) can be updated atomically
 * via {@link updateCnh} (admin flow, all-or-nothing) or partially via
 * {@link setCnhExpiresAt} / {@link setCnhCategories} (driver self-service).
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
   */
  static create(
    props: Omit<DriverProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): DriverEntity {
    return new DriverEntity(props);
  }

  /**
   * Restores a driver from persisted data (skips default assignment).
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

  get cnhCategories(): CnhCategories {
    return this.props.cnhCategories;
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

  activate(): void {
    this.props.driverStatus = DriverStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.driverStatus = DriverStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.driverStatus = DriverStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  /**
   * Atomic CNH update — replaces all three fields together (admin flow).
   */
  updateCnh(cnh: Cnh, categories: CnhCategories, expiresAt: Date): void {
    this.props.cnh = cnh;
    this.props.cnhCategories = categories;
    this.props.cnhExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  /**
   * Partial update for driver self-service: refresh CNH expiration date only.
   */
  setCnhExpiresAt(expiresAt: Date): void {
    this.props.cnhExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  /**
   * Partial update for driver self-service: replace held CNH categories.
   * Use this when a driver gains/loses a category (e.g. adds D after a course).
   */
  setCnhCategories(categories: CnhCategories): void {
    this.props.cnhCategories = categories;
    this.props.updatedAt = new Date();
  }
}
