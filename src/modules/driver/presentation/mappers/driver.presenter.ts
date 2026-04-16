import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverResponseDto } from '../../application/dtos/driver-response.dto';

export class DriverPresenter {
  /**
   * Converts a DriverEntity to the HTTP response DTO.
   * @param driver - DriverEntity from domain
   * @returns DriverResponseDto formatted for the API
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
   * Converts a list of DriverEntity to HTTP response DTOs.
   * @param drivers - Array of DriverEntity
   * @returns Array of DriverResponseDto formatted for the API
   */
  static toHTTPList(drivers: DriverEntity[]): DriverResponseDto[] {
    return drivers.map((driver) => this.toHTTP(driver));
  }
}
