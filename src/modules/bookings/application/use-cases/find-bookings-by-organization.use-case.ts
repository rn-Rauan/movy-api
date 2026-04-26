import { Injectable } from '@nestjs/common';
import { PaginationOptions } from 'src/shared/domain/interfaces';
import { BookingRepository } from '../../domain/interfaces';

@Injectable()
export class FindBookingsByOrganizationUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(organizationId: string, options: PaginationOptions) {
    return this.bookingRepository.findByOrganizationId(organizationId, options);
  }
}
