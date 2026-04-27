import { DriverEntity } from '../entities/driver.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Abstract repository contract for the {@link DriverEntity} aggregate.
 *
 * The concrete implementation ({@link PrismaDriverRepository}) is bound in
 * {@link DriverModule} via the NestJS DI token `DriverRepository`.
 */
export abstract class DriverRepository {
  /**
   * Persists a new driver entity.
   *
   * @param driver - {@link DriverEntity} to save
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(driver: DriverEntity): Promise<DriverEntity | null>;

  /**
   * Finds a driver by its unique UUID.
   *
   * @param id - UUID of the driver
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  abstract findById(id: string): Promise<DriverEntity | null>;

  /**
   * Finds a driver by the associated user's UUID.
   *
   * @param userId - UUID of the user
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  abstract findByUserId(userId: string): Promise<DriverEntity | null>;

  /**
   * Finds a driver by their CNH number (unique).
   *
   * @param cnh - Driver license number string
   * @returns The matching {@link DriverEntity}, or `null` if not found
   */
  abstract findByCnh(cnh: string): Promise<DriverEntity | null>;

  /**
   * Returns a paginated list of drivers linked to the given organization
   * via an active `DRIVER` role membership.
   *
   * @param organizationId - UUID of the organization
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link DriverEntity} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>>;

  /**
   * Updates an existing driver entity.
   *
   * @param driver - {@link DriverEntity} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(driver: DriverEntity): Promise<DriverEntity | null>;

  /**
   * Checks whether a driver holds an active membership in the given organization.
   *
   * @param driverId - UUID of the driver
   * @param organizationId - UUID of the organization
   * @returns `true` if the driver has an active role in that organization
   */
  abstract belongsToOrganization(
    driverId: string,
    organizationId: string,
  ): Promise<boolean>;

  /**
   * Hard-deletes a driver record.
   *
   * @param id - UUID of the driver to remove
   */
  abstract delete(id: string): Promise<void>;
}
