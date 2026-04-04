import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { BcryptHashProvider } from 'src/shared/providers/hash/bcrypt-hash.provider';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { AuthController } from './presentation/controllers/auth.controller';
import { LoginUseCase, RefreshTokenUseCase, RegisterUseCase } from './application/use-cases';
import { JwtStrategy } from './infrastructure/jwt.strategy';

@Global()
@Module({
  imports: [
    UserModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback-secret',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
    JwtStrategy,
    {
      provide: HashProvider,
      useClass: BcryptHashProvider,
    },
  ],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}