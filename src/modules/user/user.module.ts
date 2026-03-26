import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/database/prisma.module';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { PrismaUserRepository } from './infrastructure/db/repositories/prisma-user.repository';
import { UserRepository } from './domain/interfaces/user.repository';
import { BcryptHashProvider } from 'src/shared/providers/hash/bcrypt-hash.provider';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: HashProvider,
      useClass: BcryptHashProvider,
    },
  ],
  exports: [CreateUserUseCase],
})
export class UserModule {}
