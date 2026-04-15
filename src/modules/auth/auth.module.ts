import { Module, Global, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { MembershipModule } from '../membership/membership.module';
import { OrganizationModule } from '../organization/organization.module';
import { PrismaModule } from 'src/shared/infrastructure/database/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { BcryptHashProvider } from 'src/shared/providers/hash/bcrypt-hash.provider';
import { HashProvider } from 'src/shared/providers/interfaces/hash.interface';
import { AuthController } from './presentation/controllers/auth.controller';
import {
  LoginUseCase,
  RefreshTokenUseCase,
  RegisterOrganizationWithAdminUseCase,
  RegisterUseCase,
  SetupOrganizationForExistingUserUseCase,
} from './application/use-cases';
import { JwtPayloadService } from './application/services/jwt-payload.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';

@Global()
@Module({
  imports: [
    UserModule,
    MembershipModule,
    forwardRef(() => OrganizationModule),
    PrismaModule,
    SharedModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    RegisterOrganizationWithAdminUseCase,
    SetupOrganizationForExistingUserUseCase,
    RefreshTokenUseCase,
    JwtPayloadService, // ✅ NOVO: Serviço para enriquecer JWTs
    JwtStrategy,
    {
      provide: HashProvider,
      useClass: BcryptHashProvider,
    },
  ],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
