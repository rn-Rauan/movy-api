import { Organization } from 'src/modules/organization/domain/entities';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { OrganizationMapper } from '../mappers/organization.mapper';
import { Injectable } from '@nestjs/common';

/**
 * Prisma-backed implementation of {@link OrganizationRepository}.
 *
 * All I/O operations target the `organization` table via the Prisma Client.
 */
@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new organization row via `prisma.organization.create`.
   *
   * @param organization - The {@link Organization} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.db.organization.create({
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an organization by UUID via `prisma.organization.findUnique`.
   *
   * @param id - UUID of the organization
   * @returns The matching {@link Organization}, or `null` if not found
   */
  async findById(id: string): Promise<Organization | null> {
    const organizationData = await this.db.organization.findUnique({
      where: {
        id: id,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Returns a paginated list of organizations the given user belongs to,
   * filtered through the `memberships` relation.
   *
   * @param userId - UUID of the user
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link Organization} items
   */
  async findOrganizationByUserId(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = {
      memberships: {
        some: {
          userId: userId,
        },
      },
    };

    const [organizationsData, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.db.organization.count({ where }),
    ]);

    return {
      data: organizationsData.map((org) => OrganizationMapper.toDomain(org)),
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds an organization by its unique CNPJ via `prisma.organization.findUnique`.
   *
   * @param cnpj - Formatted CNPJ string
   * @returns The matching {@link Organization}, or `null` if not found
   */
  async findByCnpj(cnpj: string): Promise<Organization | null> {
    const organizationData = await this.db.organization.findUnique({
      where: {
        cnpj: cnpj,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an organization by its unique slug via `prisma.organization.findUnique`.
   *
   * @param slug - The organization's URL slug
   * @returns The matching {@link Organization}, or `null` if not found
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const organizationData = await this.db.organization.findUnique({
      where: {
        slug: slug,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an organization by its unique email via `prisma.organization.findUnique`.
   *
   * @param email - Email address of the organization
   * @returns The matching {@link Organization}, or `null` if not found
   */
  async findByEmail(email: string): Promise<Organization | null> {
    const organizationData = await this.db.organization.findUnique({
      where: {
        email: email,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Updates an existing organization row via `prisma.organization.update`.
   *
   * @param organization - The {@link Organization} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.db.organization.update({
      where: {
        id: organization.id,
      },
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Returns a paginated list of all organizations regardless of status,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of all {@link Organization} items
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [organizationData, total] = await Promise.all([
      this.db.organization.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.db.organization.count(),
    ]);

    return {
      data: organizationData.map((org) => OrganizationMapper.toDomain(org)),
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a paginated list of `ACTIVE` organizations,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link Organization} items
   */
  async findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = { status: 'ACTIVE' as const };

    const [organizationData, total] = await Promise.all([
      this.db.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.db.organization.count({ where }),
    ]);

    return {
      data: organizationData.map((org) => OrganizationMapper.toDomain(org)),
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Deletes an Organization entity from the database.
   * @param id - UUID of the organization to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.organization.delete({
      where: {
        id: id,
      },
    });
  }
}
