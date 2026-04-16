import { Membership } from '../entities/membership.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * @param userId - UUID of the user associated with the membership
 * @param organizationId - UUID of the organization to which the membership belongs
 * @param role - Object containing the name of the role assigned to the user within the organization (e.g., 'ADMIN' or 'DRIVER')
 */
export interface FirstMembershipDTO {
  userId: string;
  organizationId: string;
  role: {
    name: 'ADMIN' | 'DRIVER';
  };
}

export abstract class MembershipRepository {
  /**
   * Save a membership to the database.
   * @param membership - Membership entity to save
   * @returns Saved membership entity
   */
  abstract save(membership: Membership): Promise<Membership>;
  /**
   * Find a membership by composite composite key.
   * @param userId - UUID of the user associated with the membership
   * @param roleId - ID of the role assigned to the user within the organization
   * @param organizationId - UUID of the organization to which the membership belongs
   * @returns Membership entity or null if not found
   */
  abstract findByCompositeKey(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership | null>;
  /**
   * Find all memberships for a user with pagination.
   * @param userId - UUID of the user to find memberships for
   * @param options - Pagination options for (page, limit)
   * @param organizationId - Optional UUID of the organization to filter memberships by
   * @returns Paginated response with membership entities
   */
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<Membership>>;
  /**
   * Find all memberships for an organization with pagination.
   * @param organizationId - UUID of the organization to find memberships for
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with membership entities
   */
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>>;
  /**
   * Update a membership in the database.
   * @param membership - Membership entity to update
   * @returns Updated membership entity
   */
  abstract update(membership: Membership): Promise<Membership>;
  /**
   * Find a membership by user ID and organization ID.
   * @param userId - UUID of the user associated with the membership
   * @param organizationId - UUID of the organization to which the membership belongs
   * @returns Membership entity or null if not found
   */
  abstract findByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
 /**
  * Delete a membership from the database.
  * @param userId - UUID of the user associated with the membership
  * @param roleId - ID of the role assigned to the user within the organization
  * @param organizationId - UUID of the organization to which the membership belongs
  * @returns void
  */
  abstract delete(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void>;

  /**
   * Find the first active membership for a user.
   * Used to populate role + organizationId in JWT
   *
   * @param userId - UUID of the user
   * @returns First active membership or null if none found
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
