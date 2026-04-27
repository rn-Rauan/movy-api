import { Injectable } from '@nestjs/common';
import { TripTemplate } from '../../domain/entities';
import { TripTemplateRepository } from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all {@link TripTemplate} items for an organisation.
 *
 * Restricted to org administrators via `RolesGuard` + `TenantFilterGuard`.
 * Returns templates of any status (including `INACTIVE`).
 */
@Injectable()
export class FindAllTripTemplatesByOrganizationUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Delegates to the repository for a paginated result ordered by `createdAt` descending.
   *
   * @param organizationId - UUID of the organisation
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripTemplate} items
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripTemplate>> {
    return this.tripTemplateRepository.findByOrganizationId(
      organizationId,
      options,
    );
  }
}
