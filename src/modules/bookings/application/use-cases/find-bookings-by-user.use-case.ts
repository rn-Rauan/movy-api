import { Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class FindBookingsByUserUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Lists all bookings belonging to a specific user with pagination.
   * @param userId - UUID of the user
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with BookingResponseDto list ordered by enrollment date
   */
  async execute(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<BookingResponseDto>> {
    const result = await this.bookingRepository.findByUserId(userId, options);

    return {
      ...result,
      data: BookingPresenter.toHTTPList(result.data),
    };
  }
}
