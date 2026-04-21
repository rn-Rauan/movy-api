import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { Organization } from '../../domain/entities';

@Injectable()
export class FindOrganizationByUserUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Finds all organizations associated with a given user.
   * @param userId - UUID of the user
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with Organization entities the user belongs to
   */
  async execute(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    return this.organizationRepository.findOrganizationByUserId(
      userId,
      options,
    );
  }
}
