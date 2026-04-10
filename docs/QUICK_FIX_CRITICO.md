# ⚡ QUICK FIX - Action Items (CRÍTICO)

> **Nota**: 8 problemas CRÍTICOS precisam ser fixados ANTES de qualquer deploy em produção

---

## 🚨 FIX #1: Credenciais Expostas (15 min)

```bash
# 1. Revogar AGORA no Supabase
# https://supabase.com/dashboard

# 2. Git cleanup
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "security: remove .env from tracking"

# 3. Criar .env.example
cp .env .env.example

# 4. Editar .env.example (remover valores reais)
DATABASE_URL=postgresql://user:password@localhost:5432/movy
JWT_SECRET=CHANGE_ME_TO_STRONG_KEY
```

---

## 🚨 FIX #2: Register sem Membership (2h)

### Problema
```typescript
// User registra mas fica sem organizationId
// JWT vira vazio, user não consegue acessar nada
```

### Código

**Arquivo: `src/modules/auth/application/dtos/register.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '11999999999',
    description: 'The telephone number of the user',
  })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  // ✅ NOVO: Organização opcional (B2C pode omitir)
  @ApiProperty({
    example: 'org-uuid-here',
    description: 'Organization ID (optional for B2C users)',
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
```

**Arquivo: `src/modules/auth/application/use-cases/register.use-case.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../../user/application/use-cases';
import { CreateMembershipUseCase } from '../../../membership/application/use-cases'; // ✅ NOVO
import { RegisterDto, TokenResponseDto } from '../dtos';
import { LoginUseCase } from './login.use-case';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createMembershipUseCase: CreateMembershipUseCase, // ✅ NOVO
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async execute(registerDto: RegisterDto): Promise<TokenResponseDto> {
    // Create the user
    const user = await this.createUserUseCase.execute({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      telephone: registerDto.telephone || '',
    });

    // ✅ NOVO: Se fornecido organizationId, criar membership
    if (registerDto.organizationId) {
      await this.createMembershipUseCase.execute({
        userId: user.id,
        organizationId: registerDto.organizationId,
        roleId: 1, // ADMIN role como default
      });
    }

    // Auto-login after registration
    return this.loginUseCase.execute({
      email: registerDto.email,
      password: registerDto.password,
    });
  }
}
```

---

## 🚨 FIX #3: Refresh Token sem User Status Check (1h)

**Arquivo: `src/modules/auth/application/use-cases/refresh-token.use-case.ts`**

```typescript
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { JwtPayloadService } from '../services/jwt-payload.service';
import { TokenResponseDto } from '../dtos';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly jwtPayloadService: JwtPayloadService,
  ) {}

  async execute(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // Step 1: Verify JWT signature
      const payload = this.jwtService.verify(refreshToken);

      // Step 2: ✅ NOVO - Buscar user (para validar status)
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        this.logger.warn(`[Refresh] User not found: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      // Step 3: ✅ NOVO - Validar que user está ATIVO
      if (user.status === 'INACTIVE') {
        this.logger.warn(`[Refresh] User is inactive: ${user.id}`);
        throw new UnauthorizedException('User account is inactive');
      }

      // Step 4: Re-enrich payload
      const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);

      // Step 5: Issue new tokens
      const accessToken = this.jwtService.sign(enrichedPayload);
      const newRefreshToken = this.jwtService.sign(enrichedPayload, { expiresIn: '7d' });

      this.logger.log(`[Refresh] SUCCESS: userId=${user.id}`);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.warn(`[Refresh] FAILED: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

---

## 🚨 FIX #4: Logs Expõem Dados (30 min)

**Arquivo: `src/modules/auth/application/use-cases/login.use-case.ts`**

```typescript
// ❌ ANTES
this.logger.log(`[Login] SUCCESS: userId=${user.id}, org=${enrichedPayload.organizationId}`);

// ✅ DEPOIS - Não logar IDs específicos em produção
this.logger.log(`[Login] Successful authentication completed`);

// Se precisar logar userId para debug:
if (process.env.NODE_ENV === 'development') {
  this.logger.debug(`[Login] userId=${user.id}, org=${enrichedPayload.organizationId}`);
}
```

**Arquivo: `src/shared/presentation/interceptors/tenant-context.interceptor.ts`**

```typescript
// ❌ ANTES (console.log)
console.log(`[TenantContext] userId=${tenantContext.userId}, ...`);

// ✅ DEPOIS (remover completamente ou apenas debug)
// console.log(...) NUNCA em produção
if (process.env.NODE_ENV === 'development') {
  this.logger.debug(`[TenantContext] Context populated for request`);
}
```

---

## 🚨 FIX #5: JWT Secret Fallback (10 min)

**Arquivo: `src/modules/auth/auth.module.ts`**

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    // ✅ NOVO: Validar que JWT_SECRET existe
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'CRITICAL: JWT_SECRET must be set in environment variables. ' +
        'Generated tokens will be insecure!'
      );
    }
    
    return {
      secret,
      signOptions: { expiresIn: '1h' },
    };
  },
}),
```

---

## 🚨 FIX #6: Rate Limiting (2h)

```bash
# 1. Install throttler
npm install @nestjs/throttler

# 2. Adicionar ao package.json (já está instalado?)
# "dependencies": { "@nestjs/throttler": "^5.0.0" }
```

**Arquivo: `src/app.module.ts`**

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ✅ NOVO
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1 minuto
        limit: 100,  // 100 requests / minuto global
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true }),
    // ... rest
  ],
})
export class AppModule {}
```

**Arquivo: `src/modules/auth/presentation/controllers/auth.controller.ts`**

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // ✅ NOVO: 5 logins por minuto
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.loginUseCase.execute(loginDto);
  }

  // ✅ NOVO: 3 registros por hora
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    return this.registerUseCase.execute(registerDto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<TokenResponseDto> {
    return this.refreshTokenUseCase.execute(refreshToken);
  }
}
```

---

## 🚨 FIX #7: CORS + Helmet (1h)

```bash
npm install @nestjs/helmet
```

**Arquivo: `src/main.ts`**

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ NOVO: CORS seguro
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600,
    optionsSuccessStatus: 200,
  });

  // ✅ NOVO: Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Tighten em prod
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // ... rest do código
}
```

**Arquivo: `.env`**

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://movy.com
```

---

## 🚨 FIX #8: Password Validation (2h)

**Arquivo: `src/shared/infrastructure/validators/is-strong-password.validator.ts`** (✨ NOVO)

```typescript
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(options?: ValidationOptions) {
  return registerDecorator({
    name: 'isStrongPassword',
    target: Object,
    propertyName: 'password',
    options,
    validator: {
      validate(value: string) {
        // Mínimo 12 caracteres
        if (value.length < 12) return false;

        // Pelo menos 1 maiúscula
        if (!/[A-Z]/.test(value)) return false;

        // Pelo menos 1 minúscula
        if (!/[a-z]/.test(value)) return false;

        // Pelo menos 1 número
        if (!/[0-9]/.test(value)) return false;

        // Pelo menos 1 símbolo
        if (!/[@#$%^&*()_\-+={}[\]|:;<>?,./]/.test(value)) return false;

        // Não é texto muito repetido
        if (/(.)\1{3,}/.test(value)) return false; // aaaa, 1111 etc

        return true;
      },
      defaultMessage() {
        return (
          'Password must contain: 12+ chars, uppercase, lowercase, number, symbol. ' +
          'Example: MyPass@2026'
        );
      },
    },
  });
}
```

**Arquivo: `src/modules/auth/application/dtos/register.dto.ts`**

```typescript
import { IsStrongPassword } from 'src/shared/infrastructure/validators/is-strong-password.validator';

export class RegisterDto {
  // ... outros fields

  @ApiProperty({
    example: 'MyPass@2026',
    description: 'Strong password (12+ chars, mixed case, number, symbol)',
  })
  @IsStrongPassword()
  password: string;
}
```

**Arquivo: `src/modules/user/application/dto/create-user.dto.ts`**

```typescript
import { IsStrongPassword } from 'src/shared/infrastructure/validators/is-strong-password.validator';

export class CreateUserDto {
  // ... outros fields

  @ApiProperty({
    example: 'MyPass@2026',
  })
  @IsStrongPassword()
  password: string;
}
```

---

## ✅ Validar Fixes

```bash
# 1. Compilar para verificar erros de tipo
npm run build

# 2. Se houver erros, corrigir
# Se compilou, fazer start dev
npm run start:dev

# 3. Testar cada endpoint
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "WeakPass",
    "telephone": "11999999999"
  }'
# ❌ Deve falhar com password validation error

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "MySecurePass@2026",
    "telephone": "11999999999"
  }'
# ✅ Deve funcionar

# 4. Verificar logs (não devem ter user IDs específicos)
# Você verá: [Login] Successful authentication completed
# Você NÃO verá: [Login] userId=abc123...
```

---

## 📋 Checklist de Implementação

- [ ] FIX #1: Credenciais removidas de .env
- [ ] FIX #2: RegisterDto + RegisterUseCase com membership
- [ ] FIX #3: RefreshTokenUseCase com user status check
- [ ] FIX #4: Logs sem dados sensíveis
- [ ] FIX #5: JWT_SECRET validação obrigatória
- [ ] FIX #6: Rate limiting nos endpoints auth
- [ ] FIX #7: CORS + Helmet habilitados
- [ ] FIX #8: Password validation forte
- [ ] ✅ Compilação sem erros (npm run build)
- [ ] ✅ Servidor inicia sem erro (npm run start:dev)
- [ ] ✅ Testes manuais passam

---

## ⏱️ Tempo Total: ~8 horas

- FIX #1: 15 min
- FIX #2: 2h
- FIX #3: 1h
- FIX #4: 30 min
- FIX #5: 10 min
- FIX #6: 2h
- FIX #7: 1h
- FIX #8: 2h
- **Testing/Verification**: 1h

**Total: ~9,5h de trabalho**

Se fizer com focus, consegue em 1 dia.
