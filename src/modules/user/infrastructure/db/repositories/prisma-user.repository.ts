import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/domain/entities';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/types/interfaces';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<User | null> {
    const userData = await this.prisma.user.create({
      data: UserMapper.toPersistence(user),
    });

    return UserMapper.toDomain(userData);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) return null;

    return UserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!userData) return null;

    return UserMapper.toDomain(userData);
  }

  async update(user: User): Promise<User | null> {
    const userData = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: UserMapper.toPersistence(user),
    });

    return UserMapper.toDomain(userData);
  }

  async findAll(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      data: users.map((user) => UserMapper.toDomain(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}
