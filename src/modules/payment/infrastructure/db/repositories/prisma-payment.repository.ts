import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { PaymentEntity } from 'src/modules/payment/domain/entities/payment.entity';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(payment: PaymentEntity): Promise<PaymentEntity | null> {
    const data = PaymentMapper.toPersistence(payment);
    const result = await this.prisma.payment.create({ data });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const result = await this.prisma.payment.findUnique({ where: { id } });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  async findByEnrollmentId(
    enrollmentId: string,
  ): Promise<PaymentEntity | null> {
    const result = await this.prisma.payment.findUnique({
      where: { enrollmentId },
    });
    return result ? PaymentMapper.toDomain(result) : null;
  }

  async findAllByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<PaymentEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { organizationId } }),
    ]);

    return {
      data: payments.map(PaymentMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
