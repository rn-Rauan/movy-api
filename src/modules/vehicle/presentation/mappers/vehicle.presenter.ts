import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleResponseDto } from '../../application/dtos/vehicle-response.dto';

/**
 * Serialises a {@link VehicleEntity} domain object into the HTTP response shape {@link VehicleResponseDto}.
 *
 * Responsible for unwrapping the {@link Plate} Value Object into a plain `string`.
 * Should be called exclusively from controller methods, never from use cases.
 */
export class VehiclePresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param vehicle - The {@link VehicleEntity} to serialise
   * @returns A {@link VehicleResponseDto} safe to include in an HTTP response
   */
  static toHTTP(vehicle: VehicleEntity): VehicleResponseDto {
    return new VehicleResponseDto({
      id: vehicle.id,
      plate: vehicle.plate.value_,
      model: vehicle.model,
      type: vehicle.type,
      maxCapacity: vehicle.maxCapacity,
      status: vehicle.status,
      organizationId: vehicle.organizationId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    });
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param vehicles - Array of {@link VehicleEntity} instances to serialise
   * @returns Array of {@link VehicleResponseDto} objects
   */
  static toHTTPList(vehicles: VehicleEntity[]): VehicleResponseDto[] {
    return vehicles.map((v) => this.toHTTP(v));
  }
}
