import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './infrastructure/database/prisma.module';
import { JwtAuthGuard } from './infrastructure/guards/jwt.guard';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './presentation/exceptions/all-exceptions.filter';
import { BcryptHashProvider } from './providers/hash/bcrypt-hash.provider';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { TenantFilterGuard } from './infrastructure/guards/tenant-filter.guard';
import { DevGuard } from './infrastructure/guards/dev.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    DevGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    BcryptHashProvider,
    TenantFilterGuard,
  ],
  exports: [
    PrismaModule,
    JwtAuthGuard,
    BcryptHashProvider,
    TenantFilterGuard,
    RolesGuard,
    DevGuard,
  ],
})
export class SharedModule {}
