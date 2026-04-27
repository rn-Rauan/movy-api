import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Membership } from '../../domain/entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of all memberships belonging to a given organization.
 *
 * @remarks
 * Delegates directly to {@link MembershipRepository.findByOrganizationId}.
 * Includes both active and soft-removed memberships.
 */
@Injectable()
export class FindMembershipsByOrganizationUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  /**
   * Find all memberships for a given organization.
   * @param organizationId - UUID of the organization to search for memberships
   * @param options - Pagination options
   * @returns Paginated response containing memberships for the given organization
   */
  async execute(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>> {
    return this.membershipRepository.findByOrganizationId(
      organizationId,
      options,
    );
  }
}
