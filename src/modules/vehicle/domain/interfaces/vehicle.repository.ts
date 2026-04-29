import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { VehicleEntity } from '../entities/vehicle.entity';

/**
 * Abstract repository contract for the {@link VehicleEntity} aggregate.
 *
 * @remarks
 * Implementations must map between raw persistence records and
 * {@link VehicleEntity} domain objects. The concrete implementation
 * ({@link PrismaVehicleRepository}) is bound to this token inside {@link VehicleModule}
 * and exported for use by {@link TripModule}.
 */
export abstract class VehicleRepository {
  /**
   * Inserts a new vehicle row into the persistence layer.
   *
   * @param vehicle - The {@link VehicleEntity} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  abstract save(vehicle: VehicleEntity): Promise<VehicleEntity | null>;

  /**
   * Finds a vehicle by UUID.
   *
   * @param id - UUID of the vehicle
   * @returns The matching {@link VehicleEntity}, or `null` if not found
   */
  abstract findById(id: string): Promise<VehicleEntity | null>;

  /**
   * Finds a vehicle by its normalised plate string.
   *
   * @param plate - Normalised plate string (e.g. `"ABC1234"`)
   * @returns The matching {@link VehicleEntity}, or `null` if not found
   */
  abstract findByPlate(plate: string): Promise<VehicleEntity | null>;

  /**
   * Returns a paginated list of all vehicles belonging to an organisation.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link VehicleEntity} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<VehicleEntity>>;

  /**
   * Updates an existing vehicle row with the entity's current state.
   *
   * @param vehicle - The {@link VehicleEntity} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  abstract update(vehicle: VehicleEntity): Promise<VehicleEntity | null>;

  /**
   * Hard-deletes a vehicle row from the persistence layer.
   *
   * @param id - UUID of the vehicle to delete
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Returns the count of ACTIVE vehicles belonging to an organisation.
   * Used for plan limit enforcement before creating a new vehicle.
   *
   * @param organizationId - UUID of the organisation
   * @returns Number of active vehicles
   */
  abstract countActiveByOrganizationId(organizationId: string): Promise<number>;
}
