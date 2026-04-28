import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/domain/entities';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from 'src/modules/user/domain/interfaces/user.repository';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * Prisma-backed implementation of {@link UserRepository}.
 *
 * All I/O operations target the `user` table via the Prisma Client.
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Inserts a new user row via `prisma.user.create`.
   *
   * @param user - The {@link User} to persist
   * @returns The saved entity, or `null` on unexpected failure
   */
  async save(user: User): Promise<User | null> {
    const userData = await this.db.user.create({
      data: UserMapper.toPersistence(user),
    });

    return UserMapper.toDomain(userData);
  }

  /**
   * Finds a user by UUID via `prisma.user.findUnique`.
   *
   * @param id - UUID of the user
   * @returns The matching {@link User}, or `null` if not found
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) return null;

    return UserMapper.toDomain(user);
  }

  /**
   * Finds a user by their unique email address via `prisma.user.findUnique`.
   *
   * @param email - The user's email string
   * @returns The matching {@link User}, or `null` if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!userData) return null;

    return UserMapper.toDomain(userData);
  }

  /**
   * Updates an existing user row via `prisma.user.update`.
   *
   * @param user - The {@link User} with updated state
   * @returns The updated entity, or `null` on unexpected failure
   */
  async update(user: User): Promise<User | null> {
    const userData = await this.db.user.update({
      where: {
        id: user.id,
      },
      data: UserMapper.toPersistence(user),
    });

    return UserMapper.toDomain(userData);
  }

  /**
   * Returns a paginated list of `ACTIVE` users, ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of active {@link User} items
   */
  async findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<User>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.db.user.count({
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

  /**
   * Returns a paginated list of all users regardless of status,
   * ordered by `createdAt` descending.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of all {@link User} items
   */
  async findAll(options: PaginationOptions): Promise<PaginatedResponse<User>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.db.user.count(),
    ]);

    return {
      data: users.map((user) => UserMapper.toDomain(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Hard-deletes a user row via `prisma.user.delete`.
   *
   * @param id - UUID of the user to delete
   */
  async delete(id: string): Promise<void> {
    await this.db.user.delete({
      where: {
        id: id,
      },
    });
  }
}
