import { DriverEntity } from '../entities/driver.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

export abstract class DriverRepository {
  /**
   * Persists a new driver entity.
   * @param driver - DriverEntity to save
   * @returns DriverEntity persisted or null on failure
   */
  abstract save(driver: DriverEntity): Promise<DriverEntity | null>;

  /**
   * Finds a driver by its unique ID.
   * @param id - UUID of the driver
   * @returns DriverEntity or null if not found
   */
  abstract findById(id: string): Promise<DriverEntity | null>;

  /**
   * Finds a driver by the associated user ID.
   * @param userId - UUID of the user
   * @returns DriverEntity or null if not found
   */
  abstract findByUserId(userId: string): Promise<DriverEntity | null>;

  /**
   * Finds a driver by CNH number.
   * @param cnh - Driver license number
   * @returns DriverEntity or null if not found
   */
  abstract findByCnh(cnh: string): Promise<DriverEntity | null>;

  /**
   * Lists all drivers belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with DriverEntity list
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>>;

  /**
   * Updates an existing driver entity.
   * @param driver - DriverEntity with updated data
   * @returns DriverEntity updated or null on failure
   */
  abstract update(driver: DriverEntity): Promise<DriverEntity | null>;

  /**
   * Checks if a driver belongs to the given organization via active membership.
   * @param driverId - UUID of the driver
   * @param organizationId - UUID of the organization
   * @returns true if the driver is an active member of the organization
   */
  abstract belongsToOrganization(
    driverId: string,
    organizationId: string,
  ): Promise<boolean>;

  /**
   * Permanently deletes a driver.
   * @param id - UUID of the driver to remove
   */
  abstract delete(id: string): Promise<void>;
}
