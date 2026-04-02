import { Status } from 'src/shared/domain/types/status.type';
import { Email, PasswordHash, Telephone, UserName } from './value-objects';

/**
 * Interface that defines the properties of the User entity.
 *
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
