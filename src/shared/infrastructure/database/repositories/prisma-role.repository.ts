import { Injectable } from '@nestjs/common';
import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { DbContext } from '../db-context';
import { RoleMapper } from '../mappers/role.mapper';
import { RoleName } from 'generated/prisma/enums';

/**
 * Prisma implementation of {@link RoleRepository}.
 * Queries the `role` table seeded at startup — no write operations.
 */
@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * @param id - Numeric ID of the role
   * @returns Role entity or null if not found
   */
  async findById(id: number): Promise<Role | null> {
    const role = await this.db.role.findUnique({
      where: { id },
    });

    if (!role) return null;

    return RoleMapper.toDomain(role);
  }

  /**
   * @param name - Role name enum value (e.g. 'ADMIN')
   * @returns Role entity or null if not found
   */
  async findByName(name: RoleName): Promise<Role | null> {
    const role = await this.db.role.findUnique({
      where: { name },
    });

    if (!role) return null;

    return RoleMapper.toDomain(role);
  }
}
