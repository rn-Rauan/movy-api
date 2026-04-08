import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './infrastructure/database/prisma.module';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './presentation/exceptions/all-exceptions.filter';
import { BcryptHashProvider } from './providers/hash/bcrypt-hash.provider';
import { RolesGuard } from './guards/roles.guard';
import { RoleRepository } from './domain/interfaces/role.repository';
import { PrismaRoleRepository } from './infrastructure/database/repositories/prisma-role.repository';
import { Role } from './domain/entities/role.entity';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
    BcryptHashProvider,
  ],
  exports: [PrismaModule, JwtAuthGuard, BcryptHashProvider, RoleRepository],
})
export class SharedModule {}
