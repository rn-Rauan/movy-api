import { Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { BookingRepository } from '../../domain/interfaces';
import { BookingResponseDto } from '../dtos';
import { BookingPresenter } from '../../presentation/mappers/booking.presenter';

@Injectable()
export class FindBookingsByOrganizationUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Lists all bookings belonging to an organization with pagination.
   * @param organizationId - UUID of the organization from JWT context
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with BookingResponseDto list ordered by enrollment date
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<BookingResponseDto>> {
    const result = await this.bookingRepository.findByOrganizationId(
      organizationId,
      options,
    );

    return {
      ...result,
      data: BookingPresenter.toHTTPList(result.data),
    };
  }
}
