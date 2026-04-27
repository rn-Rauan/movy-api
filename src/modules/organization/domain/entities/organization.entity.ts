import { Status } from 'src/shared/domain/types/status.type';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';
import { Cnpj, Slug, OrganizationName, Address } from './value-objects';

/** @internal */
export interface OrganizationProps {
  readonly id: string;
  name: OrganizationName;
  cnpj: Cnpj;
  email: Email;
  telephone: Telephone;
  slug: Slug;
  address: Address;
  status?: Status;
  readonly createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Aggregate root representing a Movy organization (company/fleet operator).
 *
 * @remarks
 * Each organization has a unique `cnpj`, `email`, and `slug`.
 * All mutable fields expose `set*` mutators that also refresh `updatedAt`.
 * Status transitions: `ACTIVE` → `INACTIVE` (soft delete via `setStatus`).
 *
 * @see {@link OrganizationRepository} for persistence operations
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
   * Creates a new organization with default `ACTIVE` status.
   *
   * @param props - Organization properties (omits `createdAt`, `status`, `updatedAt`)
   * @returns A new {@link Organization} instance
   */
  static create(
    props: Omit<OrganizationProps, 'createdAt' | 'status' | 'updatedAt'>,
  ): Organization {
    return new Organization(props);
  }

  /**
   * Restores an organization from persisted data (skips default assignment).
   *
   * @param props - Full organization properties from storage
   * @returns A hydrated {@link Organization} instance
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

  get address(): string {
    return this.props.address.value_;
  }

  setAddress(address: string): void {
    this.props.address = Address.create(address);
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
