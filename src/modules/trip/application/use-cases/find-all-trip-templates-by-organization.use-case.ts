import { Injectable } from '@nestjs/common';
import { TripTemplate } from '../../domain/entities';
import { TripTemplateRepository } from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindAllTripTemplatesByOrganizationUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Lists all trip templates belonging to an organization with pagination.
   * @param organizationId - UUID of the organization
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripTemplate list
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
