import { VehicleEntity } from '../../domain/entities/vehicle.entity';
import { VehicleResponseDto } from '../../application/dtos/vehicle-response.dto';

export class VehiclePresenter {
  /**
   * Converts a VehicleEntity to the HTTP response DTO.
   * @param vehicle - VehicleEntity from domain
   * @returns VehicleResponseDto formatted for the API
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
   * Converts a list of VehicleEntity to HTTP response DTOs.
   * @param vehicles - Array of VehicleEntity
   * @returns Array of VehicleResponseDto formatted for the API
   */
  static toHTTPList(vehicles: VehicleEntity[]): VehicleResponseDto[] {
    return vehicles.map((v) => this.toHTTP(v));
  }
}
