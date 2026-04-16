import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleName } from 'src/shared/domain/types';

interface RoleFactoryOverrides {
  id?: number;
  name?: RoleName;
}

export function makeRole(overrides: RoleFactoryOverrides = {}): Role {
  return Role.create({
    id: overrides.id ?? 1,
    name: overrides.name ?? RoleName.ADMIN,
  });
}
