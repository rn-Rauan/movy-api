import { Injectable } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import { Cnh, CnhCategory } from '../../domain/entities/value-objects';
import { CreateDriverDto } from '../dtos';
import { randomUUID } from 'crypto';
import {
  DriverCreationFailedError,
  DriverAlreadyExistsError,
} from '../../domain/entities/errors/driver.errors';

/**
 * Creates a new driver profile for the requesting user.
 *
 * @remarks
 * Enforces uniqueness: a user may only have one driver profile.
 * All three CNH fields are required and validated through Value Objects.
 * Plan limit enforcement (maxDrivers) is handled by CreateMembershipUseCase
 * when a DRIVER role membership is created for an organisation.
 */
@Injectable()
export class CreateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  /**
   * Creates a new driver profile for the given user.
   * @param userId - ID of the user to create the driver profile for
   * @param input - Driver creation data (CNH, category, expiration)
   * @returns DriverEntity created and persisted
   * @throws DriverAlreadyExistsError if user already has a driver profile
   * @throws DriverCreationFailedError if persistence fails
   */
  async execute(userId: string, input: CreateDriverDto): Promise<DriverEntity> {
    const existing = await this.driverRepository.findByUserId(userId);
    if (existing) {
      throw new DriverAlreadyExistsError(userId);
    }

    const driver = DriverEntity.create({
      id: randomUUID(),
      userId,
      cnh: Cnh.create(input.cnh),
      cnhCategory: CnhCategory.create(input.cnhCategory),
      cnhExpiresAt: new Date(input.cnhExpiresAt),
    });

    const savedDriver = await this.driverRepository.save(driver);

    if (!savedDriver) {
      throw new DriverCreationFailedError();
    }

    return savedDriver;
  }
}
