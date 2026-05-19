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
import { EmailService } from './infrastructure/email/email.service.interface';
import { ConsoleEmailService } from './infrastructure/email/console-email.service';
import { InMemoryEmailLog } from './infrastructure/email/in-memory-email-log';
import { DevEmailsController } from './presentation/controllers/dev-emails.controller';

/**
 * `@Global()` NestJS module that exports shared infrastructure to every module
 * in the application without requiring explicit imports.
 *
 * @remarks
 * Provides and exports:
 * - Guards: `JwtAuthGuard`, `RolesGuard`, `TenantFilterGuard`, `DevGuard`
 * - Global filter: `AllExceptionsFilter` (via `APP_FILTER`)
 * - Global interceptor: `LoggingInterceptor` (via `APP_INTERCEPTOR`)
 * - Provider: `BcryptHashProvider` (implements {@link HashProvider})
 * - Re-exports `PrismaModule` (exports `PrismaService` + `RoleRepository`)
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [DevEmailsController],
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
    InMemoryEmailLog,
    { provide: EmailService, useClass: ConsoleEmailService },
  ],
  exports: [
    PrismaModule,
    JwtAuthGuard,
    BcryptHashProvider,
    TenantFilterGuard,
    RolesGuard,
    DevGuard,
    EmailService,
    InMemoryEmailLog,
  ],
})
export class SharedModule {}
