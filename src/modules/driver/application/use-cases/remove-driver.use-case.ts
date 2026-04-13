import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverNotFoundError } from '../../domain/entities/errors/driver.errors';

@Injectable()
export class RemoveDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(id: string): Promise<void> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new DriverNotFoundError(id);
    }

    driver.deactivate();
    
    await this.driverRepository.update(driver);
  }
}
