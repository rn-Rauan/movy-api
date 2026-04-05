import { User as PrismaUser } from 'generated/prisma/client';
import { User } from 'src/modules/user/domain/entities';
import {
  PasswordHash,
  UserName,
} from 'src/modules/user/domain/entities/value-objects';
import { Email, Telephone } from 'src/shared/domain/entities/value-objects';


export class UserMapper {
  /**
   * Map PrismaUser to User domain entity
   * @param raw PrismaUser entity
   * @returns User domain entity
   */
  static toDomain(raw: PrismaUser): User {
    return User.restore({
      id: raw.id,
      name: UserName.create(raw.name),
      email: Email.create(raw.email),
      passwordHash: PasswordHash.create(raw.passwordHash),
      telephone: Telephone.create(raw.telephone),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map User domain entity to PrismaUser entity
   * @param user User domain entity
   * @returns PrismaUser entity
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
