import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/domain/entities';
import { PrismaService } from 'src/shared/database/prisma.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';

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

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    return users.map(user => UserMapper.toDomain(user));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}