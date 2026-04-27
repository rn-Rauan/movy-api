import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { Organization } from '../../domain/entities';

/**
 * Returns a paginated list of `ACTIVE` organizations.
 *
 * @remarks
 * Publicly accessible via `GET /organizations/active` (no special guard).
 * Delegates directly to {@link OrganizationRepository.findAllActive}.
 */
@Injectable()
export class FindAllActiveOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * List all active organizations with pagination.
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with active Organization entities
   */
  async execute(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    return this.organizationRepository.findAllActive(options);
  }
}
