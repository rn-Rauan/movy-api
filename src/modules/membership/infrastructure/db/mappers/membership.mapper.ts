import { OrganizationMembership as PrismaMembership } from 'generated/prisma/client';
import { Membership } from 'src/modules/membership/domain/entities';

export class MembershipMapper {
  /**
   * Map PrismaMembership to Membership domain entity
   * @param raw PrismaMembership entity
   * @returns Membership domain entity
   */
  static toDomain(raw: PrismaMembership): Membership {
    return Membership.restore({
      userId: raw.userId,
      roleId: raw.roleId,
      organizationId: raw.organizationId,
      assignedAt: raw.assignedAt,
      removedAt: raw.removedAt,
    });
  }

  /**
   * Map Membership domain entity to PrismaMembership entity
   * @param membership Membership domain entity
   * @returns PrismaMembership entity
   */
  static toPersistence(membership: Membership): PrismaMembership {
    return {
      userId: membership.userId,
      roleId: membership.roleId,
      organizationId: membership.organizationId,
      assignedAt: membership.assignedAt,
      removedAt: membership.removedAt,
    };
  }
}
