import { MembershipResponseDto } from '../../application/dtos/membership-response.dto';
import { Membership } from '../../domain/entities';

export class MembershipPresenter {
  /**
   * Converts a Membership entity to the HTTP response DTO.
   * @param membership - Membership entity from domain
   * @returns MembershipResponseDto formatted for the API
   */
  toHTTP(membership: Membership): MembershipResponseDto {
    return new MembershipResponseDto({
      userId: membership.userId,
      roleId: membership.roleId,
      organizationId: membership.organizationId,
      assignedAt: membership.assignedAt,
      removedAt: membership.removedAt,
    });
  }

  /**
   * Converts a list of Membership entities to HTTP response DTOs.
   * @param memberships - Array of Membership entities
   * @returns Array of MembershipResponseDto formatted for the API
   */
  toListHTTP(memberships: Membership[]): MembershipResponseDto[] {
    return memberships.map((membership) => this.toHTTP(membership));
  }
}
