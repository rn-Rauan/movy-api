import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import type { Status } from 'src/shared/domain/types';
import { BookingRepository } from '../../domain/interfaces';

@Injectable()
export class FindBookingsByUserUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(userId: string, options: PaginationOptions, status?: Status) {
    return this.bookingRepository.findByUserId(userId, options, status);
  }
}
