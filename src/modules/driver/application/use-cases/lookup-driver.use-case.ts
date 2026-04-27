import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverLookupResponseDto } from '../dtos';
import {
  DriverNotFoundError,
  DriverProfileNotFoundByEmailError,
} from '../../domain/entities/errors/driver.errors';

/**
 * Looks up a driver profile by email + CNH for the admin enrollment flow.
 *
 * @remarks
 * Both identifiers must match the same user to succeed — this acts as
 * identity verification before an admin creates a membership.
 * Depends on both {@link DriverRepository} and {@link UserRepository}.
 */
@Injectable()
export class LookupDriverUseCase {
  constructor(
    private readonly driverRepository: DriverRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Looks up a driver profile by email + CNH for admin enrollment.
   * Both must match — acts as identity verification.
   * @param userEmail - Email of the user to look up
   * @param cnh - CNH number for identity verification
   * @returns DriverLookupResponseDto with driver and user info
   * @throws DriverProfileNotFoundByEmailError if user with given email does not exist
   * @throws DriverNotFoundError if no driver matches the CNH or user mismatch
   */
  async execute(
    userEmail: string,
    cnh: string,
  ): Promise<DriverLookupResponseDto> {
    const user = await this.userRepository.findByEmail(userEmail);
    if (!user) {
      throw new DriverProfileNotFoundByEmailError(userEmail);
    }

    const driver = await this.driverRepository.findByCnh(cnh);
    if (!driver || driver.userId !== user.id) {
      throw new DriverNotFoundError(undefined, undefined, cnh);
    }

    return new DriverLookupResponseDto({
      driverId: driver.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      cnhCategory: driver.cnhCategory.value_,
      cnhExpiresAt: driver.cnhExpiresAt,
      driverStatus: driver.driverStatus,
    });
  }
}
