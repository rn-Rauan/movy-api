import { OrganizationMembership as PrismaMembership } from 'generated/prisma/client';
import { Membership } from 'src/modules/membership/domain/entities';

/**
 * Bidirectional mapper between the Prisma `OrganizationMembership` model
 * and the {@link Membership} domain object. Contains no business logic.
 */
export class MembershipMapper {
  /**
   * Converts a raw Prisma `OrganizationMembership` record to a {@link Membership} domain object.
   *
   * @param raw - Raw record returned by the Prisma client
   * @returns A hydrated {@link Membership} instance
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
   * Converts a {@link Membership} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param membership - The {@link Membership} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.organizationMembership.create({ data })`
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
