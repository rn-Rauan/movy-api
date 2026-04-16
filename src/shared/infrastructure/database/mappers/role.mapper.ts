import { Role as PrismaRole } from 'generated/prisma/client';
import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleName } from 'src/shared/domain/types/role-name.enum';

export class RoleMapper {
  /**
   * @param raw - Prisma Role record
   * @returns Role domain entity
   */
  static toDomain(raw: PrismaRole): Role {
    return Role.restore({
      id: raw.id,
      name: raw.name as RoleName,
    });
  }

  /**
   * @param role - Role domain entity
   * @returns Plain object for Prisma persistence
   */
  static toPersistence(role: Role): { id: number; name: RoleName } {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
