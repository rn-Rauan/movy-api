import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripInstance } from '../entities';

export abstract class TripInstanceRepository {
  /**
   * Persists a new trip instance entity.
   * @param entity - TripInstance to save
   * @returns TripInstance persisted or null on failure
   */
  abstract save(entity: TripInstance): Promise<TripInstance | null>;

  /**
   * Updates an existing trip instance entity.
   * @param entity - TripInstance with updated data
   * @returns TripInstance updated or null on failure
   */
  abstract update(entity: TripInstance): Promise<TripInstance | null>;

  /**
   * Deletes a trip instance by its unique identifier.
   * @param id - UUID of the trip instance
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Finds a trip instance by its unique ID.
   * @param id - UUID of the trip instance
   * @returns TripInstance or null if not found
   */
  abstract findById(id: string): Promise<TripInstance | null>;

  /**
   * Lists all trip instances with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
   */
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;

  /**
   * Lists trip instances belonging to a specific organization.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;

  /**
   * Lists trip instances belonging to a specific trip template.
   * @param templateId - UUID of the trip template
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list
   */
  abstract findByTemplateId(
    templateId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>>;
}
