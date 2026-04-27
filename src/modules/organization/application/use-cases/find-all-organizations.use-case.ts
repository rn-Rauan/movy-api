import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { Organization } from '../../domain/entities';

/**
 * Returns a paginated list of all organizations, including inactive ones.
 *
 * @remarks
 * Restricted to dev/admin callers — access control is enforced at the controller layer.
 * Delegates directly to {@link OrganizationRepository.findAll}.
 */
@Injectable()
export class FindAllOrganizationsUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Finds all organizations (including inactive).
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with all Organization entities
   */
  async execute(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    return this.organizationRepository.findAll(options);
  }
}
