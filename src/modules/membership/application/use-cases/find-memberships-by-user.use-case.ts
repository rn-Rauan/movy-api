import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Membership } from '../../domain/entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindMembershipsByUserUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  /**
   * Find all memberships for a given user.
   * @param userId - UUID of the user to search for memberships
   * @param options - Pagination options
   * @param organizationId - Optional UUID of the organization to filter memberships by
   * @returns Paginated response containing memberships for the given user
   */
  async execute(
    userId: string,
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<Membership>> {
    return this.membershipRepository.findByUserId(
      userId,
      options,
      organizationId,
    );
  }
}
