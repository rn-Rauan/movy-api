import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverNotFoundError } from '../../domain/entities/errors/driver.errors';

@Injectable()
export class FindDriverByUserIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Finds a driver profile by the associated user ID.
   * @param userId - UUID of the user
   * @returns DriverEntity found
   * @throws DriverNotFoundError if no driver profile exists for this user
   */
  async execute(userId: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      throw new DriverNotFoundError(undefined, userId);
    }

    return driver;
  }
}
