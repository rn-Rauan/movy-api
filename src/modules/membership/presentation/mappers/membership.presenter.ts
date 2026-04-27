import { MembershipResponseDto } from '../../application/dtos/membership-response.dto';
import { Membership } from '../../domain/entities';

/**
 * Serialises a {@link Membership} domain object into the HTTP response shape
 * {@link MembershipResponseDto}.
 *
 * @remarks
 * Instantiated as a NestJS provider (not static) so it can be injected into
 * the controller via DI. Should be called exclusively from controller methods.
 */
export class MembershipPresenter {
  /**
   * Maps a single entity to its HTTP response DTO.
   *
   * @param membership - The {@link Membership} to serialise
   * @returns A {@link MembershipResponseDto} safe to include in an HTTP response
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
   * Maps a collection of entities to an array of HTTP response DTOs.
   *
   * @param memberships - Array of {@link Membership} instances to serialise
   * @returns Array of {@link MembershipResponseDto} objects
   */
  toListHTTP(memberships: Membership[]): MembershipResponseDto[] {
    return memberships.map((membership) => this.toHTTP(membership));
  }
}
