import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MembershipModule } from './modules/membership/membership.module';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    OrganizationModule,
    MembershipModule,
    AuthModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
