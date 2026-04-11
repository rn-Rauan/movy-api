import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DriverRepository } from '../../domain/interfaces';
import { DriverEntity } from '../../domain/entities/driver.entity';
import {
  Cnh,
  CnhCategory,
} from '../../domain/entities/value-objects';
import { CreateDriverDto } from '../dtos';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(input: CreateDriverDto): Promise<DriverEntity> {
    const driver = DriverEntity.create({
      id: randomUUID(),
      userId: input.userId,
      organizationId: input.organizationId,
      cnh: Cnh.create(input.cnh),
      cnhCategory: CnhCategory.create(input.cnhCategory),
      cnhExpiresAt: new Date(input.cnhExpiresAt),
    });

    const savedDriver = await this.driverRepository.save(driver);

    if (!savedDriver) {
      throw new InternalServerErrorException('Failed to create driver');
    }

    return savedDriver;
  }
}
