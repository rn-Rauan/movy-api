import { Status } from 'src/shared/domain/types/status.type';
import { Telephone, Email } from 'src/shared/domain/value-objects';
import { Cnpj, Slug, OrganizationName } from './value-objects';

/**
 * Interface that defines the properties of the Organization entity.
 */
export interface OrganizationProps {
  readonly id: string;
  name: OrganizationName;
  cnpj: Cnpj;
  email: Email;
  telephone: Telephone;
  slug: Slug;
  status?: Status;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entity Organization
 *
 * Responsibility:
 * - Manage organization data
 * - Validate data integrity
 */
export class Organization {
  private readonly props: Required<OrganizationProps>;

  private constructor(props: OrganizationProps) {
    const now: Date = new Date();

    this.props = {
      ...props,
      status: props.status ?? ('ACTIVE' as Status),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
  }

  /**
   * Method to create a new Organization instance.
   */
  static create(
    props: Omit<OrganizationProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): Organization {
    return new Organization(props);
  }

  /**
   * Method to restore a existing Organization instance.
   */
  static restore(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name.value_;
  }

  setName(name: string): void {
    this.props.name = OrganizationName.create(name);
    this.props.updatedAt = new Date();
  }

  get cnpj(): string {
    return this.props.cnpj.value_;
  }

  setCnpj(cnpj: string): void {
    this.props.cnpj = Cnpj.create(cnpj);
    this.props.updatedAt = new Date();
  }

  get email(): string {
    return this.props.email.value_;
  }

  setEmail(email: string): void {
    this.props.email = Email.create(email);
    this.props.updatedAt = new Date();
  }

  get telephone(): string {
    return this.props.telephone.value_;
  }

  setTelephone(telephone: string): void {
    this.props.telephone = Telephone.create(telephone);
    this.props.updatedAt = new Date();
  }

  get slug(): string {
    return this.props.slug.value_;
  }

  setSlug(slug: string): void {
    this.props.slug = Slug.create(slug);
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
