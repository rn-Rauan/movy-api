import { Organization } from 'src/modules/organization/domain/entities';
import { OrganizationRepository } from 'src/modules/organization/domain/interfaces/organization.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { OrganizationMapper } from '../mappers/organization.mapper';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saves an Organization entity to the database.
   * @param organization - Organization entity to persist
   * @returns Organization entity created or null if creation failed
   */
  async save(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.create({
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an Organization entity by its ID.
   * @param id - UUID of the organization to find
   * @returns Organization entity or null if not found
   */
  async findById(id: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        id: id,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

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

    const [organizationsData, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
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
   * Finds an Organization entity by its CNPJ.
   * @param cnpj - CNPJ of the organization to find
   * @returns Organization entity or null if not found
   */
  async findByCnpj(cnpj: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        cnpj: cnpj,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an Organization entity by its slug.
   * @param slug - Unique slug of the organization to find
   * @returns Organization entity or null if not found
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        slug: slug,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Finds an Organization entity by its email.
   * @param email - Email of the organization to find
   * @returns Organization entity or null if not found
   */
  async findByEmail(email: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        email: email,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Updates an Organization entity in the database.
   * @param organization - Organization entity to update
   * @returns Organization entity updated or null if update failed or
   */
  async update(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }

  /**
   * Lists all organizations with pagination (including inactive ones).
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with all Organization entities
   */
  async findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [organizationData, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.prisma.organization.count(),
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
   * Lists all active organizations with pagination.
   * @param options - Pagination options for (page, limit)
   * @returns Paginated response with all active Organization entities
   */
  async findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = { status: 'ACTIVE' as const };

    const [organizationData, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
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
    await this.prisma.organization.delete({
      where: {
        id: id,
      },
    });
  }
}
