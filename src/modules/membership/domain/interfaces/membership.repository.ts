import { Membership } from '../entities/membership.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

export abstract class MembershipRepository {
  abstract save(membership: Membership): Promise<Membership>;
  abstract findByCompositeKey(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership | null>;
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>>;
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>>;
  abstract update(membership: Membership): Promise<Membership>;
  abstract delete(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void>;
}
