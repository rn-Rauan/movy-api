import { Organization } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
export abstract class OrganizationRepository {
  /**
   * Persists a new organization in the database.
   * @param organization - Organization entity to be saved
   * @returns Persisted Organization entity or null in case of failure
   */
  abstract save(organization: Organization): Promise<Organization | null>;

  /**
   * Finds an organization by ID in the database.
   * @param id - UUID of the organization
   * @returns Organization entity or null if not found
   */
  abstract findById(id: string): Promise<Organization | null>;

  /**
   * Finds an organization by user ID in the database.
   * @param userId - UUID of the user
   * @returns Paginated response with Organization entities or null if not found
   */
  abstract findOrganizationByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;

  /**
   * Finds an organization by CNPJ in the database.
   * @param cnpj - CNPJ of the organization
   * @returns Organization entity or null if not found
   */
  abstract findByCnpj(cnpj: string): Promise<Organization | null>;

  /**
   * Finds an organization by slug in the database.
   * @param slug - Unique slug of the organization
   * @returns Organization entity or null if not found
   */
  abstract findBySlug(slug: string): Promise<Organization | null>;

  /**
   * Finds an organization by email in the database.
   * @param email - Email of the organization
   * @returns Organization entity or null if not found
   */
  abstract findByEmail(email: string): Promise<Organization | null>;

  /**
   * Updates an existing organization in the database.
   * @param organization - Organization entity with updated data
   * @returns Organization entity or null if update failed
   */
  abstract update(organization: Organization): Promise<Organization | null>;

  /**
   * Lists all organizations with pagination (including inactive ones).
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with all Organization entities
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;

  /**
   * Lists all active organizations with pagination.
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with active Organization entities
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
