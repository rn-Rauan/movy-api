import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import { DriverNotFoundError } from '../../domain/entities/errors/driver.errors';

@Injectable()
export class FindDriverNameByIdUseCase {
  constructor(
    private readonly driverRepository: DriverRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(driverId: string): Promise<string> {
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) throw new DriverNotFoundError(driverId);

    const user = await this.userRepository.findById(driver.userId);
    if (!user) throw new DriverNotFoundError(driverId);

    return user.name;
  }
}
