import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionRepository } from 'src/modules/subscriptions/domain/interfaces/subscription.repository';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';
import { SubscriptionMapper } from '../mappers/subscription.mapper';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null> {
    const data = SubscriptionMapper.toPersistence(subscription);
    const result = await this.prisma.subscription.create({ data });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  async update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity | null> {
    const result = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: subscription.status, updatedAt: subscription.updatedAt },
    });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  async findById(id: string): Promise<SubscriptionEntity | null> {
    const result = await this.prisma.subscription.findUnique({ where: { id } });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  async findActiveByOrganizationId(
    organizationId: string,
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
  ): Promise<SubscriptionEntity | null> {
    const result = await this.prisma.subscription.findFirst({
      where: { organizationId, status },
      orderBy: { createdAt: 'desc' },
    });
    return result ? SubscriptionMapper.toDomain(result) : null;
  }

  async findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<SubscriptionEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.subscription.count({ where: { organizationId } }),
    ]);

    return {
      data: subscriptions.map((subscription) =>
        SubscriptionMapper.toDomain(subscription),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
