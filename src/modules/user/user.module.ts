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

@Module({
  imports: [PrismaModule],
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
  ],
})
export class UserModule {}
