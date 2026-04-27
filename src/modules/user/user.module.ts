import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { PrismaUserRepository } from './infrastructure/db/repositories/prisma-user.repository';
import { UserRepository } from './domain/interfaces/user.repository';
import { BcryptHashProvider } from 'src/shared/providers/hash/bcrypt-hash.provider';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { UserController } from './presentation/controllers/user.controller';
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  FindUserByIdUseCase,
  DisableUserUseCase,
  FindAllActiveUsersUseCase,
  FindAllUsersUseCase,
} from './application/use-cases';
import { SharedModule } from 'src/shared';

/**
 * NestJS module managing the {@link User} aggregate.
 *
 * @remarks
 * Exports {@link UserRepository} and several use cases so that
 * dependent modules ({@link AuthModule}, {@link MembershipModule}) can
 * resolve and query users without importing the full module.
 *
 * {@link HashProvider} is bound to {@link BcryptHashProvider} locally;
 * it is NOT exported — hashing is an internal concern of this module.
 */
/**
 * NestJS module managing the {@link User} aggregate.
 *
 * @remarks
 * Exports {@link UserRepository} and several use cases so that
 * dependent modules ({@link AuthModule}, {@link MembershipModule}) can
 * resolve and query users without importing the full module.
 *
 * {@link HashProvider} is bound to {@link BcryptHashProvider} locally;
 * it is NOT exported — hashing is an internal concern of this module.
 */
@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase,
    FindUserByIdUseCase,
    DisableUserUseCase,
    FindAllActiveUsersUseCase,
    FindAllUsersUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: HashProvider,
      useClass: BcryptHashProvider,
    },
  ],
  exports: [
    CreateUserUseCase,
    UpdateUserUseCase,
    FindUserByIdUseCase,
    FindAllActiveUsersUseCase,
    FindAllUsersUseCase,
    UserRepository,
  ],
})
export class UserModule {}
