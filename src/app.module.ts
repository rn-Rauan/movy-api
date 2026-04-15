import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MembershipModule } from './modules/membership/membership.module';
import { AuthModule } from './modules/auth/auth.module';
import { DriverModule } from './modules/driver/driver.module';
import { SharedModule } from './shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    UserModule,
    OrganizationModule,
    MembershipModule,
    AuthModule,
    DriverModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
