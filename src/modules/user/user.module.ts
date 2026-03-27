import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/database/prisma.module';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { PrismaUserRepository } from './infrastructure/db/repositories/prisma-user.repository';
import { UserRepository } from './domain/interfaces/user.repository';
import { BcryptHashProvider } from 'src/shared/providers/hash/bcrypt-hash.provider';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { UserController } from './presentation/controllers/user.controller';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { DisableUserUseCase } from './application/use-cases/disable-user.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase, 
    FindUserByIdUseCase,
    DisableUserUseCase,
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
  exports: [CreateUserUseCase, UpdateUserUseCase, FindUserByIdUseCase, FindAllUsersUseCase],
})
export class UserModule {}