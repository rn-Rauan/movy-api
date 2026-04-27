import { User as PrismaUser } from 'generated/prisma/client';
import { User } from 'src/modules/user/domain/entities';
import {
  PasswordHash,
  UserName,
} from 'src/modules/user/domain/entities/value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';

/**
 * Bidirectional mapper between the Prisma `User` model and the {@link User} domain object.
 *
 * Reconstructs all Value Objects (`UserName`, `Email`, `PasswordHash`, `Telephone`)
 * from their persisted string representations. Contains no business logic.
 */
export class UserMapper {
  /**
   * Converts a raw Prisma `User` record to a {@link User} domain object.
   *
   * @param raw - Raw `User` record returned by the Prisma client
   * @returns A fully hydrated {@link User} instance
   */
  static toDomain(raw: PrismaUser): User {
    return User.restore({
      id: raw.id,
      name: UserName.create(raw.name),
      email: Email.restore(raw.email),
      passwordHash: PasswordHash.create(raw.passwordHash),
      telephone: Telephone.restore(raw.telephone),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Converts a {@link User} domain object to the plain object expected by Prisma's
   * `create` and `update` methods.
   *
   * @param user - The {@link User} instance to serialise
   * @returns A plain persistence-layer object compatible with `prisma.user.create({ data })`
   */
  static toPersistence(user: User): PrismaUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      telephone: user.telephone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
