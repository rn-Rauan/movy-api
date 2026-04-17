import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { VehicleEntity } from '../entities/vehicle.entity';

export abstract class VehicleRepository {
  /**
   * Persists a new vehicle entity.
   * @param vehicle - VehicleEntity to save
   * @returns VehicleEntity persisted or null on failure
   */
  abstract save(vehicle: VehicleEntity): Promise<VehicleEntity | null>;

  /**
   * Finds a vehicle by its unique ID.
   * @param id - UUID of the vehicle
   * @returns VehicleEntity or null if not found
   */
  abstract findById(id: string): Promise<VehicleEntity | null>;

  /**
   * Finds a vehicle by its plate (unique).
   * @param plate - Normalized plate string (e.g. "ABC1234")
   * @returns VehicleEntity or null if not found
   */
  abstract findByPlate(plate: string): Promise<VehicleEntity | null>;

  /**
   * Lists all vehicles belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with VehicleEntity list
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<VehicleEntity>>;

  /**
   * Updates an existing vehicle entity.
   * @param vehicle - VehicleEntity with updated data
   * @returns VehicleEntity updated or null on failure
   */
  abstract update(vehicle: VehicleEntity): Promise<VehicleEntity | null>;

  /**
   * Permanently deletes a vehicle.
   * @param id - UUID of the vehicle to remove
   */
  abstract delete(id: string): Promise<void>;
}
