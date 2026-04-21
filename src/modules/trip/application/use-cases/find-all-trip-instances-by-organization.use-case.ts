import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import { TripInstanceRepository } from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindAllTripInstancesByOrganizationUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Lists all trip instances belonging to an organization with pagination.
   * @param organizationId - UUID of the organization from JWT context
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list ordered by departure time
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    return this.tripInstanceRepository.findByOrganizationId(organizationId, options);
  }
}
