import { Membership } from '../entities/membership.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Minimal projection returned by `findFirstActiveByUserId`.
 * Contains only the data needed to populate a JWT payload.
 *
 * @internal
 */
export interface FirstMembershipDTO {
  userId: string;
  organizationId: string;
  role: {
    name: 'ADMIN' | 'DRIVER';
  };
}

/**
 * Abstract repository contract for the {@link Membership} aggregate.
 *
 * The concrete implementation ({@link PrismaMembershipRepository}) is bound in
 * {@link MembershipModule} via the NestJS DI token `MembershipRepository`.
 */
export abstract class MembershipRepository {
  /**
   * Persists a new membership.
   *
   * @param membership - {@link Membership} to save
   * @returns The saved entity
   */
  abstract save(membership: Membership): Promise<Membership>;
  /**
   * Finds a membership by its composite primary key `(userId, roleId, organizationId)`.
   *
   * @param userId - UUID of the user
   * @param roleId - Numeric role ID
   * @param organizationId - UUID of the organization
   * @returns The matching {@link Membership}, or `null` if not found
   */
  abstract findByCompositeKey(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership | null>;
  /**
   * Returns a paginated list of memberships for a given user,
   * optionally filtered to a specific organization.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @param organizationId - Optional UUID to scope the query to one organization
   * @returns A {@link PaginatedResponse} of {@link Membership} items
   */
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<Membership>>;
  /**
   * Returns a paginated list of all memberships belonging to an organization.
   *
   * @param organizationId - UUID of the organization
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Membership} items
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>>;
  /**
   * Updates an existing membership (used for soft-remove and restore operations).
   *
   * @param membership - {@link Membership} with updated state
   * @returns The updated entity
   */
  abstract update(membership: Membership): Promise<Membership>;
  /**
   * Finds the first active membership for a user in a given organization.
   * Used for role-lookup when no `roleId` is known.
   *
   * @param userId - UUID of the user
   * @param organizationId - UUID of the organization
   * @returns The matching {@link Membership}, or `null` if not found
   */
  abstract findByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
  /**
   * Hard-deletes a membership record by composite key.
   *
   * @param userId - UUID of the user
   * @param roleId - Numeric role ID
   * @param organizationId - UUID of the organization
   */
  abstract delete(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void>;

  /**
   * Returns the first active membership for a user, ordered by `assignedAt ASC`.
   * Used exclusively to populate the JWT payload with `role` and `organizationId`.
   *
   * @param userId - UUID of the user
   * @returns A {@link FirstMembershipDTO} or `null` if the user has no active memberships
   */
  abstract findFirstActiveByUserId(
    userId: string,
  ): Promise<FirstMembershipDTO | null>;

  /**
   * Find all active memberships for a user.
   * Useful for future multi-org switching operations
   *
   * @param userId - UUID of the user
   * @returns Array of memberships with active status
   */
  abstract findAllActiveByUserId(userId: string): Promise<FirstMembershipDTO[]>;

  /**
   * Validate if a user has an active membership for a specific organization.
   * @param userId - UUID of the user
   * @param organizationId - UUID of the organization to check for active membership
   * @returns true if active membership exists, or false otherwise
   */
  abstract hasActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
}
