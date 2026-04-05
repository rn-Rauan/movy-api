import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './infrastructure/database/prisma.module';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LoggingInterceptor } from './presentation/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './presentation/exceptions/all-exceptions.filter';
import { BcryptHashProvider } from './providers/hash/bcrypt-hash.provider';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    BcryptHashProvider,
  ],
  exports: [
    PrismaModule,
    JwtAuthGuard,
    BcryptHashProvider,
  ],
})
export class SharedModule {}