import { Membership } from 'src/modules/membership/domain/entities';
import {
  MembershipRepository,
  FirstMembershipDTO,
} from 'src/modules/membership/domain/interfaces/membership.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { MembershipMapper } from '../mappers/membership.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(membership: Membership): Promise<Membership> {
    const membershipData = await this.prisma.organizationMembership.create({
      data: MembershipMapper.toPersistence(membership),
    });
    return MembershipMapper.toDomain(membershipData);
  }

  async findByCompositeKey(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership | null> {
    const membershipData = await this.prisma.organizationMembership.findUnique({
      where: {
        userId_roleId_organizationId: {
          userId,
          roleId,
          organizationId,
        },
      },
    });
    if (!membershipData) return null;
    return MembershipMapper.toDomain(membershipData);
  }

  async findByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [membershipData, total] = await Promise.all([
      this.prisma.organizationMembership.findMany({
        where: { userId },
        skip,
        take: limit,
      }),
      this.prisma.organizationMembership.count({
        where: { userId },
      }),
    ]);

    return {
      data: membershipData.map((m) => MembershipMapper.toDomain(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [membershipData, total] = await Promise.all([
      this.prisma.organizationMembership.findMany({
        where: { organizationId },
        skip,
        take: limit,
      }),
      this.prisma.organizationMembership.count({
        where: { organizationId },
      }),
    ]);

    return {
      data: membershipData.map((m) => MembershipMapper.toDomain(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(membership: Membership): Promise<Membership> {
    const membershipData = await this.prisma.organizationMembership.update({
      where: {
        userId_roleId_organizationId: {
          userId: membership.userId,
          roleId: membership.roleId,
          organizationId: membership.organizationId,
        },
      },
      data: MembershipMapper.toPersistence(membership),
    });
    return MembershipMapper.toDomain(membershipData);
  }

  async findByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null> {
    const membershipData = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId,
        removedAt: null,
      },
    });
    if (!membershipData) return null;
    return MembershipMapper.toDomain(membershipData);
  }

  async delete(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void> {
    await this.prisma.organizationMembership.delete({
      where: {
        userId_roleId_organizationId: {
          userId,
          roleId,
          organizationId,
        },
      },
    });
  }

  // ============================================
  // JWT-specific Operations
  // ============================================
  async findFirstActiveByUserId(
    userId: string,
  ): Promise<FirstMembershipDTO | null> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        removedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });

    if (!membership) {
      return null;
    }

    return {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: {
        name: membership.role.name as 'ADMIN' | 'DRIVER',
      },
    };
  }

  async findAllActiveByUserId(userId: string): Promise<FirstMembershipDTO[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId,
        removedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });

    return memberships.map((m) => ({
      userId: m.userId,
      organizationId: m.organizationId,
      role: {
        name: m.role.name as 'ADMIN' | 'DRIVER',
      },
    }));
  }

  async hasActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.organizationMembership.count({
      where: {
        userId,
        organizationId,
        removedAt: null,
      },
    });

    return count > 0;
  }
}
