import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../../domain/interfaces/membership.repository';
import { Membership } from '../../domain/entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindMembershipsByOrganizationUseCase {
  constructor(private readonly membershipRepository: MembershipRepository) {}

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
