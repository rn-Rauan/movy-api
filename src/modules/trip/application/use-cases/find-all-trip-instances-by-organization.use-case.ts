import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import { TripInstanceRepository } from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all {@link TripInstance} items for an organisation.
 *
 * Restricted to org administrators via `RolesGuard` + `TenantFilterGuard`.
 * Results are ordered by `departureTime` ascending.
 */
@Injectable()
export class FindAllTripInstancesByOrganizationUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
  ) {}

  /**
   * Delegates to the repository for a paginated result ordered by `departureTime` ascending.
   *
   * @param organizationId - UUID of the organisation (from JWT)
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    return this.tripInstanceRepository.findByOrganizationId(
      organizationId,
      options,
    );
  }
}
