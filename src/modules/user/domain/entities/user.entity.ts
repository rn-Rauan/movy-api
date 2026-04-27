import { Status } from 'src/shared/domain/types/status.type';
import { PasswordHash, UserName } from './value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';

/**
 * Internal property bag for the {@link User} aggregate.
 * @internal
 */
export interface UserProps {
  readonly id: string;
  name: UserName;
  email: Email;
  passwordHash: PasswordHash;
  telephone: Telephone;
  readonly createdAt?: Date;
  updatedAt?: Date;
  status?: Status;
}
/**
 * Aggregate root representing a registered user of the Movy platform.
 *
 * @remarks
 * - `name` is a {@link UserName} Value Object; length must be 3–255 characters
 * - `email` is an {@link Email} Value Object enforcing valid email format; unique in the system
 * - `passwordHash` is a {@link PasswordHash} Value Object; the raw password is never stored
 * - `telephone` is a {@link Telephone} Value Object
 * - `status` defaults to `ACTIVE` on creation; set to `INACTIVE` for soft-delete
 * - All mutating setters (`setName`, `setEmail`, etc.) refresh `updatedAt` automatically
 *
 * @see {@link UserName}
 * @see {@link PasswordHash}
 */
export class User {
  private readonly props: Required<UserProps>;

  private constructor(props: UserProps) {
    const now: Date = new Date();

    this.props = {
      ...props,
      status: props.status ?? ('ACTIVE' as Status),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Creates a new {@link User} with status `ACTIVE` and current timestamps.
   *
   * @param props - User data excluding audit timestamps and status
   * @returns A new {@link User} instance
   */
  static create(
    props: Omit<UserProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): User {
    return new User(props);
  }

  /**
   * Reconstructs a {@link User} from a persistence record.
   *
   * Skips all domain invariant checks — the data is assumed valid since
   * it was originally written through the domain layer.
   *
   * @param props - Full property snapshot from the database
   * @returns A fully hydrated {@link User} instance
   */
  static restore(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name.value_;
  }

  setName(name: string): void {
    this.props.name = UserName.create(name);
    this.props.updatedAt = new Date();
  }

  get email(): string {
    return this.props.email.value_;
  }

  setEmail(email: string): void {
    this.props.email = Email.create(email);
    this.props.updatedAt = new Date();
  }

  get passwordHash(): string {
    return this.props.passwordHash.value_;
  }

  setPasswordHash(passwordHash: string): void {
    this.props.passwordHash = PasswordHash.create(passwordHash);
    this.props.updatedAt = new Date();
  }

  get telephone(): string {
    return this.props.telephone.value_;
  }

  setTelephone(telephone: string): void {
    this.props.telephone = Telephone.create(telephone);
    this.props.updatedAt = new Date();
  }

  get status(): Status {
    return this.props.status;
  }

  setStatus(status: Status): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
