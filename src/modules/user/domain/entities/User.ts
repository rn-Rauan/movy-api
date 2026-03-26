import { Status } from "src/shared/types/Status";
import { UserValidator } from "./UserValidator";

/**
 * Interface that defines the properties of the User entity.
 * 
 */
export interface UserProps {
  readonly id: string;
  name: string;
  email: string;
  passwordHash: string;
  telephone: string;
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
  private readonly validator: UserValidator;

  private constructor(props: UserProps,validator?: UserValidator) {
    this.validator = validator || new UserValidator();

    // Validate all properties
    this.validator.validateAll({
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      telephone: props.telephone,
    });

    const now : Date = new Date();

    this.props ={
      ...props,
      status: props.status ?? ("ACTIVE" as Status),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    }
  }

  /**
   * Method to create a new User instance.
   */
  static create(props: Omit<UserProps, "createdAt" | "status" | "updatedAt" >): User {
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
    return this.props.name;
  }

  setName(name: string): void {
    this.validator.validateName(name);
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  get email(): string {
    return this.props.email;
  }

  setEmail(email: string): void {
    this.validator.validateEmail(email);
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  setPasswordHash(passwordHash: string): void {
    this.validator.validatePasswordHash(passwordHash);
    this.props.passwordHash = passwordHash;
    this.props.updatedAt = new Date();
  }

  get telephone(): string {
    return this.props.telephone;
  }

  setTelephone(telephone: string): void {
    this.validator.validateTelephone(telephone);
    this.props.telephone = telephone;
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
