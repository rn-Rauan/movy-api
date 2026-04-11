import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './infrastructure/database/prisma.module';
import { JwtAuthGuard } from './infrastructure/guards/jwt.guard';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { TenantContextInterceptor } from './presentation/interceptors/tenant-context.interceptor';
import { AllExceptionsFilter } from './presentation/exceptions/all-exceptions.filter';
import { BcryptHashProvider } from './providers/hash/bcrypt-hash.provider';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { RoleRepository } from './domain/interfaces/role.repository';
import { PrismaRoleRepository } from './infrastructure/database/repositories/prisma-role.repository';
import { TenantFilterGuard } from './infrastructure/guards/tenant-filter.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,  // ✅ NOVO: Executa DEPOIS de Guards
    },
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
    TenantFilterGuard,
  ],
  exports: [
    PrismaModule,
    JwtAuthGuard,
    BcryptHashProvider,
    RoleRepository,
    TenantFilterGuard,
    RolesGuard,
  ],
})
export class SharedModule {}
