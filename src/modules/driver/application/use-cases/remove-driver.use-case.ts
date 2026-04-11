import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';

@Injectable()
export class RemoveDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(id: string): Promise<void> {
    const driver = await this.driverRepository.findById(id);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    await this.driverRepository.delete(id);
  }
}
