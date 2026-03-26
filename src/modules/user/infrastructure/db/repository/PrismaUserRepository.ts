import { Injectable } from '@nestjs/common';
import { Status } from 'generated/prisma/enums';
import { User } from 'src/modules/user/domain/entities';
import { IUserRepository } from 'src/modules/user/domain/interfaces/IUserRepository';
import { PrismaService } from 'src/shared/database/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User | null> {
    const userData = await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        passwordHash: user.passwordHash,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    return User.restore({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      telephone: userData.telephone,
      status: userData.status,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) return null;
    return User.restore({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!userData) return null;
    return User.restore({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      telephone: userData.telephone,
      status: userData.status,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }
  async update(updatedUser: User): Promise<User | null> {
    const userData = await this.prisma.user.update({
      where: {
        id: updatedUser.id,
      },
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        passwordHash: updatedUser.passwordHash,
        telephone: updatedUser.telephone,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt,
      },
    });

    return User.restore({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      telephone: userData.telephone,
      status: userData.status,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}
