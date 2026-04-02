import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  
}
