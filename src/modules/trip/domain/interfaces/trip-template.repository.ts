import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripTemplate } from '../entities';

export abstract class TripTemplateRepository {
  /**
   * Persists a new trip template entity.
   * @param tripTemplate - TripTemplate to save
   * @returns TripTemplate persisted or null on failure
   */
  abstract save(tripTemplate: TripTemplate): Promise<TripTemplate | null>;

  /**
   * Finds a trip template by its unique ID.
   * @param id - UUID of the trip template
   * @returns TripTemplate or null if not found
   */
  abstract findById(id: string): Promise<TripTemplate | null>;

  /**
   * Lists all trip templates belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripTemplate list
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>>;
  
  /**
   * Lists active trip templates belonging to an organization.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with active TripTemplate list
   */
  abstract findActiveByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>>;

  /**
   * Updates an existing trip template entity.
   * @param tripTemplate - TripTemplate with updated data
   * @returns TripTemplate updated or null on failure
   */
  abstract update(tripTemplate: TripTemplate): Promise<TripTemplate | null>;

  /**
   * Permanently deletes a trip template.
   * @param id - UUID of the trip template to remove
   */
  abstract delete(id: string): Promise<void>;
}
