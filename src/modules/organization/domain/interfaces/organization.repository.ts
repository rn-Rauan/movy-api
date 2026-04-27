import { Organization } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
/**
 * Abstract repository contract for the {@link Organization} aggregate.
 *
 * The concrete implementation ({@link PrismaOrganizationRepository}) is bound in
 * {@link OrganizationModule} via the NestJS DI token `OrganizationRepository`.
 */
/**
 * Abstract repository contract for the {@link Organization} aggregate.
 *
 * The concrete implementation ({@link PrismaOrganizationRepository}) is bound in
 * {@link OrganizationModule} via the NestJS DI token `OrganizationRepository`.
 */
export abstract class OrganizationRepository {
  /**
   * Persists a new organization.
   *
   * @param organization - {@link Organization} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(organization: Organization): Promise<Organization | null>;

  /**
   * Finds an organization by its UUID.
   *
   * @param id - UUID of the organization
   * @returns The matching {@link Organization}, or `null` if not found
   */
  abstract findById(id: string): Promise<Organization | null>;

  /**
   * Returns a paginated list of organizations the given user belongs to
   * via their memberships.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Organization} items
   */
  abstract findOrganizationByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;

  /**
   * Finds an organization by its unique CNPJ.
   *
   * @param cnpj - Formatted CNPJ string
   * @returns The matching {@link Organization}, or `null` if not found
   */
  abstract findByCnpj(cnpj: string): Promise<Organization | null>;

  /**
   * Finds an organization by its unique URL slug.
   *
   * @param slug - The organization's slug
   * @returns The matching {@link Organization}, or `null` if not found
   */
  abstract findBySlug(slug: string): Promise<Organization | null>;

  /**
   * Finds an organization by its unique contact email.
   *
   * @param email - Email address of the organization
   * @returns The matching {@link Organization}, or `null` if not found
   */
  abstract findByEmail(email: string): Promise<Organization | null>;

  /**
   * Updates an existing organization entity.
   *
   * @param organization - {@link Organization} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(organization: Organization): Promise<Organization | null>;

  /**
   * Returns a paginated list of all organizations regardless of status,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of all {@link Organization} items
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;

  /**
   * Returns a paginated list of `ACTIVE` organizations,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link Organization} items
   */
  abstract findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;

  /**
   * Deletes an organization permanently from the database.
   * @param id - UUID of the organization to be deleted
   */
  abstract delete(id: string): Promise<void>;
}
