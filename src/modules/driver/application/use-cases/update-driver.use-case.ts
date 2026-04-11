import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import {
  Cnh,
  CnhCategory,
} from '../../domain/entities/value-objects';
import { UpdateDriverDto } from '../dtos';

@Injectable()
export class UpdateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(id: string, input: UpdateDriverDto): Promise<DriverEntity> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (input.cnh && input.cnhCategory && input.cnhExpiresAt) {
      driver.updateCnh(
        Cnh.create(input.cnh),
        CnhCategory.create(input.cnhCategory),
        new Date(input.cnhExpiresAt),
      );
    }

    if (input.status) {
      if (input.status === 'ACTIVE') {
        driver.activate();
      } else if (input.status === 'INACTIVE') {
        driver.deactivate();
      } else if (input.status === 'SUSPENDED') {
        driver.suspend();
      }
    }

    const updatedDriver = await this.driverRepository.update(driver);

    if (!updatedDriver) {
      throw new InternalServerErrorException('Failed to update driver');
    }

    return updatedDriver;
  }
}
