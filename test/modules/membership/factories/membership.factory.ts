import { Membership } from 'src/modules/membership/domain/entities';

type MembershipOverrides = Partial<{
  userId: string;
  roleId: number;
  organizationId: string;
  assignedAt: Date;
  removedAt: Date | null;
}>;

export function makeMembership(overrides: MembershipOverrides = {}): Membership {
  if (overrides.assignedAt || overrides.removedAt !== undefined) {
    return Membership.restore({
      userId: overrides.userId ?? 'user-id-stub',
      roleId: overrides.roleId ?? 1,
      organizationId: overrides.organizationId ?? 'org-id-stub',
      assignedAt: overrides.assignedAt ?? new Date('2025-01-01'),
      removedAt: overrides.removedAt ?? null,
    });
  }

  return Membership.create({
    userId: overrides.userId ?? 'user-id-stub',
    roleId: overrides.roleId ?? 1,
    organizationId: overrides.organizationId ?? 'org-id-stub',
  });
}
