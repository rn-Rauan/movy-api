import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverResponseDto } from '../../application/dtos/driver-response.dto';

/**
 * Serialises a {@link DriverEntity} domain object into the HTTP response shape {@link DriverResponseDto}.
 *
 * Extracts raw values from Value Objects (`Cnh.value_`, `CnhCategory.value_`).
 * Should be called exclusively from controller methods, never from use cases.
 */
export class DriverPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param driver - The {@link DriverEntity} to serialise
   * @returns A {@link DriverResponseDto} safe to include in an HTTP response
   */
  static toHTTP(driver: DriverEntity): DriverResponseDto {
    return new DriverResponseDto({
      id: driver.id,
      userId: driver.userId,
      cnh: driver.cnh.value_,
      cnhCategory: driver.cnhCategory.value_,
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    });
  }

  /**
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param drivers - Array of {@link DriverEntity} instances to serialise
   * @returns Array of {@link DriverResponseDto} objects
   */
  static toHTTPList(drivers: DriverEntity[]): DriverResponseDto[] {
    return drivers.map((driver) => this.toHTTP(driver));
  }
}
