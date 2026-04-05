import { Role as PrismaRole } from 'generated/prisma/client';
import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

export class RoleMapper {
  static toDomain(raw: PrismaRole): Role {
    return Role.restore({
      id: raw.id,
      name: raw.name as RoleName,
    });
  }

  static toPersistence(role: Role): { id: number; name: RoleName } {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
