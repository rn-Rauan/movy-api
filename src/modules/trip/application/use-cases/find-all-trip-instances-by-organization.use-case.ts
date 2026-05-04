import { Injectable } from '@nestjs/common';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
} from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all {@link TripInstance} items for an organisation,
 * enriched with booking occupancy counts and denormalised template fields.
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
   * Delegates to the repository for a paginated enriched result ordered by `departureTime` ascending.
   *
   * @param organizationId - UUID of the organisation (from JWT)
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstanceWithMeta} items
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>> {
    return this.tripInstanceRepository.findByOrganizationIdWithMeta(
      organizationId,
      options,
    );
  }
}
