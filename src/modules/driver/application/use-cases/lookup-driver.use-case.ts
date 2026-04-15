import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverLookupResponseDto } from '../dtos';
import {
  DriverNotFoundError,
  DriverProfileNotFoundByEmailError,
} from '../../domain/entities/errors/driver.errors';

@Injectable()
export class LookupDriverUseCase {
  constructor(
    private readonly driverRepository: DriverRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Admin busca um perfil de motorista por email + CNH para vincular à sua org.
   * Ambos devem coincidir — funciona como verificação de identidade.
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
