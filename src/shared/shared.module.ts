import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

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
import { ResendEmailService } from './infrastructure/email/resend-email.service';
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
    {
      provide: EmailService,
      useFactory: (
        configService: ConfigService,
        emailLog: InMemoryEmailLog,
      ): EmailService => {
        const apiKey = configService.get<string>('RESEND_API_KEY');
        const fromEmail = configService.get<string>('RESEND_FROM_EMAIL');

        if (apiKey && fromEmail) {
          return new ResendEmailService(configService);
        }

        return new ConsoleEmailService(emailLog);
      },
      inject: [ConfigService, InMemoryEmailLog],
    },
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
