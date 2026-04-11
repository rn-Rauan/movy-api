import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';

@Injectable()
export class FindDriverByIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(id: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }
}
