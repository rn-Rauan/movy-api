import { Status } from 'src/shared/domain/types/status.type';
import { PasswordHash, UserName } from './value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';

/**
 * Interface that defines the properties of the User entity.
 * @property {string} id - Unique identifier for the user.
 * @property {UserName} name - User's name.
 * @property {Email} email - User's email address.
 * @property {PasswordHash} passwordHash - Hashed password for authentication.
 * @property {Telephone} telephone - User's telephone number.
 * @property {Date} createdAt - Timestamp of when the user was created.
 * @property {Date} updatedAt - Timestamp of the last update to the user's data.
 * @property {Status} status - Current status of the user (e.g., ACTIVE, INACTIVE).
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
 * Entity User
 *
 * Responsibility:
 * - Manage user data
 * - Validate data integrity
 *
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
   * Method to create a new User instance.
   */
  static create(
    props: Omit<UserProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): User {
    return new User(props);
  }

  /**
   * Method to restore a existing User instance.
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
