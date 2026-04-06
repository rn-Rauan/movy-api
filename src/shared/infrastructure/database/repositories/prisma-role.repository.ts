import { Injectable } from '@nestjs/common';
import { Role } from 'src/shared/domain/entities/role.entity';
import { RoleRepository } from 'src/shared/domain/interfaces/role.repository';
import { PrismaService } from '../prisma.service';
import { RoleMapper } from '../mappers/role.mapper';
import { RoleName } from 'generated/prisma/enums';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) return null;

    return RoleMapper.toDomain(role);
  }

  async findByName(name: RoleName): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) return null;

    return RoleMapper.toDomain(role);
  }
}
