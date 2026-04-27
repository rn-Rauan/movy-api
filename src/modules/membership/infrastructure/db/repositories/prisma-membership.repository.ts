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

/**
 * Prisma-backed implementation of {@link MembershipRepository}.
 *
 * All I/O targets the `OrganizationMembership` table via the Prisma Client.
 * Paginated list methods use a parallel `$transaction([findMany, count])`
 * for consistency.
 */
@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts a new membership row via `prisma.organizationMembership.create`.
   *
   * @param membership - The {@link Membership} to persist
   * @returns The saved entity
   */
  async save(membership: Membership): Promise<Membership> {
    const membershipData = await this.prisma.organizationMembership.create({
      data: MembershipMapper.toPersistence(membership),
    });
    return MembershipMapper.toDomain(membershipData);
  }

  /**
   * Finds a membership by its composite primary key via `findUnique`.
   *
   * @param userId - UUID of the user
   * @param roleId - Numeric role ID
   * @param organizationId - UUID of the organization
   * @returns The matching {@link Membership}, or `null` if not found
   */
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

  /**
   * Returns a paginated list of memberships for the given user,
   * optionally filtered by organization. Uses a parallel `$transaction`.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @param organizationId - Optional UUID to scope the query
   * @returns A {@link PaginatedResponse} of {@link Membership} items
   */
  async findByUserId(
    userId: string,
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<Membership>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = organizationId ? { userId, organizationId } : { userId };

    const [membershipData, total] = await this.prisma.$transaction([
      this.prisma.organizationMembership.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.organizationMembership.count({ where }),
    ]);

    return {
      data: membershipData.map((m) => MembershipMapper.toDomain(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of all memberships for the given organization.
   * Uses a parallel `$transaction`.
   *
   * @param organizationId - UUID of the organization
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Membership} items
   */
  async findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [membershipData, total] = await this.prisma.$transaction([
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

  /**
   * Updates an existing membership row via `prisma.organizationMembership.update`.
   * Used for soft-remove and restore operations.
   *
   * @param membership - The {@link Membership} with updated state
   * @returns The updated entity
   */
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

  /**
   * Finds the first active membership (`removedAt = null`) for the given user
   * and organization via `findFirst`.
   *
   * @param userId - UUID of the user
   * @param organizationId - UUID of the organization
   * @returns The matching {@link Membership}, or `null` if not found
   */
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

  /**
   * Hard-deletes a membership record by composite key.
   *
   * @param userId - UUID of the user
   * @param roleId - Numeric role ID
   * @param organizationId - UUID of the organization
   */
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

  /**
   * Returns the first active membership for the user ordered by `assignedAt ASC`.
   * Includes the `role` relation for JWT payload population.
   *
   * @param userId - UUID of the user
   * @returns A {@link FirstMembershipDTO} or `null` if the user has no active memberships
   */
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

  /**
   * @param userId - UUID of the user
   * @returns Array of active membership DTOs
   */
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

  /**
   * @param userId - UUID of the user
   * @param organizationId - UUID of the organization
   * @returns true if active membership exists
   */
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
