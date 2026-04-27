import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { DriverNotFoundError } from '../../domain/entities/errors/driver.errors';

/**
 * Retrieves a driver profile by the associated user's UUID.
 *
 * @remarks
 * Used for self-service endpoints where the caller resolves their own profile.
 * Throws {@link DriverNotFoundError} if no driver profile exists for the given user.
 */
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
