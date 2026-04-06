import { MembershipResponseDto } from '../../application/dtos/membership-response.dto';
import { Membership } from '../../domain/entities';

export class MembershipPresenter {
  toHTTP(membership: Membership): MembershipResponseDto {
    return new MembershipResponseDto({
      userId: membership.userId,
      roleId: membership.roleId,
      organizationId: membership.organizationId,
      assignedAt: membership.assignedAt,
      removedAt: membership.removedAt,
    });
  }
  toListHTTP(memberships: Membership[]): MembershipResponseDto[] {
    return memberships.map((membership) => this.toHTTP(membership));
  }
}
