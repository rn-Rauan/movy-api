import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';

@Module({
  imports: [PrismaModule, UserModule, OrganizationModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
