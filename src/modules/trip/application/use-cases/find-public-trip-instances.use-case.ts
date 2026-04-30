import { Injectable } from '@nestjs/common';
import {
  PublicTripQueryService,
  PublicTripInstanceData,
} from '../../domain/interfaces';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of publicly-visible, bookable trip instances
 * enriched with route and pricing data from their parent template.
 *
 * @remarks
 * This use case requires **no authentication** and is intended for the public
 * home page of the platform, where prospective passengers browse available trips
 * before signing up.
 *
 * Delegates to {@link PublicTripQueryService} — a dedicated cross-aggregate
 * read service — so that `TripInstanceRepository` remains scoped to its own
 * aggregate (SRP).  Only instances with `tripStatus ∈ {SCHEDULED, CONFIRMED}`
 * and `template.isPublic = true` are returned, ordered by `departureTime` asc.
 *
 * When `organizationId` is provided the result is scoped to a single organisation,
 * which is the expected call pattern after resolving an org from its URL slug.
 */
@Injectable()
export class FindPublicTripInstancesUseCase {
  constructor(
    private readonly publicTripQueryService: PublicTripQueryService,
  ) {}

  /**
   * Executes the public trip instance listing.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @param organizationId - Optional organisation UUID — when supplied, only that
   *   organisation's public trips are returned
   * @returns Paginated list of {@link PublicTripInstanceData} items, each containing
   *   the trip instance fields plus the template's route and price information
   */
  async execute(
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>> {
    return this.publicTripQueryService.findPublic(options, organizationId);
  }
}
