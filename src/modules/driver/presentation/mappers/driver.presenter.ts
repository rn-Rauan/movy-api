import { Injectable } from '@nestjs/common';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverResponseDto } from '../../application/dtos/driver-response.dto';

@Injectable()
export class DriverPresenter {
  static toHTTP(driver: DriverEntity): DriverResponseDto {
    return new DriverResponseDto({
      id: driver.id,
      userId: driver.userId,
      organizationId: driver.organizationId,
      cnh: driver.cnh.value_,
      cnhCategory: driver.cnhCategory.value_,
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    });
  }

  static toHTTPList(drivers: DriverEntity[]): DriverResponseDto[] {
    return drivers.map((driver) => this.toHTTP(driver));
  }
}
