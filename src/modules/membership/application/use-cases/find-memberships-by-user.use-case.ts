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

  async execute(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>> {
    return this.membershipRepository.findByUserId(userId, options);
  }
}
