import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverNotFoundError } from '../../domain/entities/errors/driver.errors';

@Injectable()
export class FindDriverByIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(id: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new DriverNotFoundError(id);
    }

    return driver;
  }
}
