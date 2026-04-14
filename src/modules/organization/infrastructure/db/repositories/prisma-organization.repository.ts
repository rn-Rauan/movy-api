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

  async save(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.create({
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }
  async findById(id: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        id: id,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }
  async findByCnpj(cnpj: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        cnpj: cnpj,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }
  async findBySlug(slug: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        slug: slug,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }
  async findByEmail(email: string): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.findUnique({
      where: {
        email: email,
      },
    });
    if (!organizationData) return null;
    return OrganizationMapper.toDomain(organizationData);
  }
  async update(organization: Organization): Promise<Organization | null> {
    const organizationData = await this.prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: OrganizationMapper.toPersistence(organization),
    });
    return OrganizationMapper.toDomain(organizationData);
  }
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
  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({
      where: {
        id: id,
      },
    });
  }
}
