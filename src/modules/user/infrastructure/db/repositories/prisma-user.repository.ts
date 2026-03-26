import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/domain/entities';
import { IUserRepository } from 'src/modules/user/domain/interfaces/user-repository.interface';
import { PrismaService } from 'src/shared/database/prisma.service';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
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

  async update(updatedUser: User): Promise<User | null> {
    const userData = await this.prisma.user.update({
      where: {
        id: updatedUser.id,
      },
      data: UserMapper.toPersistence(updatedUser),
    });

    return UserMapper.toDomain(userData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}
