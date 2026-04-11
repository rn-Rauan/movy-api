import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';

@Injectable()
export class FindDriverByUserIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(userId: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new NotFoundException('Driver not found for this user');
    }

    return driver;
  }
}
