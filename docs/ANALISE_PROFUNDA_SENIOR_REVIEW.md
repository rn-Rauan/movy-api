# 🔍 ANÁLISE PROFUNDA DO PROJETO MOVY API - Senior Developer Review

**Data**: 9 de Abril de 2026  
**Status**: Production-Ready Assessment  
**Reviewer**: Senior Developer Architecture Analysis

---

## 📊 RESUMO EXECUTIVO

### 🔴 **CRÍTICO - 8 Issues**
Problemas que podem causar **falhas de segurança ou crashes em produção**

### 🟠 **ALTO - 12 Issues**  
Problemas de **arquitetura, performance ou maintenance** que afetam escalabilidade

### 🟡 **MÉDIO - 6 Issues**
Problemas de **best practices** e **code quality**

### 🟢 **BAIXO - 4 Issues**
Melhorias de **documentação e conformidade**

---

# 🔴 CRÍTICO - SEGURANÇA & FALHAS (8 Issues)

## 1. 🔴 **CRITICAL: Credenciais de Produção no `.env` Versionado**

### Problema
```env
# ❌ ARQUIVO: .env (versionado no git)
DATABASE_URL="postgresql://docker:docker07@localhost:5705/movy?schema=public"
DIRECT_URL="postgresql://postgres.xacszlfphrwkjrskfihu:dbyvom*24*03@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
JWT_SECRET=your-super-secret-key-change-in-production-2026
DEV_EMAILS=seu.email@movy-local,dev@movy.io,rauan@local,john@example.co
```

### Risco
- ✅ **Severidade**: CRÍTICA  
- Credenciais de produção Supabase expostas
- Chave JWT fraca (`your-super-secret-key`)
- Dev emails hard-coded com nomes reais
- Qualquer fork do repo tem acesso ao banco

### Impacto
- Acesso não autorizado ao banco de dados produção
- Falsificação de JWT
- Exposição de dados de clientes

### Solução
```bash
# 1. IMEDIATAMENTE: Revogar credenciais Supabase
# 2. Adicionar .env ao .gitignore (se ainda não estiver)
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 3. Criar .env.example
# DATABASE_URL=postgresql://user:password@host:port/db
# JWT_SECRET=generate-strong-key-here
# DEV_EMAILS=dev@company.com
```

---

## 2. 🔴 **CRITICAL: Register sem TenantId Retorna JWT sem organizationId**

### Problema
```typescript
// ❌ auth/application/use-cases/register.use-case.ts
async execute(registerDto: RegisterDto): Promise<TokenResponseDto> {
  // Cria user, mas NÃO cria membership (sem organizationId)
  await this.createUserUseCase.execute({...});
  
  // JWT será enriquecido SEM organizationId
  // JwtPayloadService.enrichPayload() não encontrará membership
  return this.loginUseCase.execute({...});
}

// Resultado: JWT contém
// {
//   sub: "user-id",
//   email: "user@example.com",
//   organizationId: undefined,  // ❌ PROBLEMA
//   role: null,
//   isDev: false
// }
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Novo usuário organizacional fica sem acesso a qualquer recurso
- TenantFilterGuard bloqueia por `organizationId undefined`
- Usuário pode estar "logado mas sem organização"

### Cenário de Falha
```typescript
// User registra com email corporativo
POST /auth/register { email: "john@acme.com", ... }
// Login bem-sucedido, mas:
GET /users/me ✅ Works (usa context.userId)
GET /organizations/1/vehicles ❌ ERRO: TenantFilterGuard rejeita (no organizationId)
// User está preso - criado mas sem membership
```

### Solução
```typescript
// ✅ FIX: RegisterUseCase.ts
async execute(registerDto: RegisterDto): Promise<TokenResponseDto> {
  // 1. Create user
  const user = await this.createUserUseCase.execute({
    name: registerDto.name,
    email: registerDto.email,
    password: registerDto.password,
    telephone: registerDto.telephone || '',
  });
  
  // 2. Se fornecido organizationId, criar membership
  if (registerDto.organizationId) {
    await this.createMembershipUseCase.execute({
      userId: user.id,
      organizationId: registerDto.organizationId,
      roleId: 1, // ADMIN role
    });
  }
  
  // 3. Auto-login
  return this.loginUseCase.execute({...});
}

// ✅ Atualizar RegisterDto
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
  
  @IsString()
  @IsNotEmpty()
  telephone: string;
  
  @IsUUID() // ✅ NOVO
  @IsOptional() // Usuário B2C pode omitir
  organizationId?: string;
}
```

---

## 3. 🔴 **CRITICAL: Refresh Token sem Validação de User Status**

### Problema
```typescript
// ❌ refresh-token.use-case.ts
async execute(refreshToken: string): Promise<TokenResponseDto> {
  // 1. Verifica signat ura JWT
  const payload = this.jwtService.verify(refreshToken);
  
  // 2. ❌ NÃO valida se user está ativo
  const enrichedPayload = await this.jwtPayloadService.enrichPayload(payload.sub);
  
  // Se admin desativou user, user ainda consegue novo token!
  const newAccessToken = this.jwtService.sign(enrichedPayload);
  return { accessToken: newAccessToken, refreshToken };
}

// Ataque: INACTIVE user com refresh token válido consegue novo JWT
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Usuário desativado continua acessando API
- Admin não consegue fazer logout forçado
- Violação de GDPR (user não consegue "desligar" a conta imediatamente)

### Solução
```typescript
// ✅ FIX: refresh-token.use-case.ts
async execute(refreshToken: string): Promise<TokenResponseDto> {
  const payload = this.jwtService.verify(refreshToken);
  
  // 1. Buscar user
  const user = await this.userRepository.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedException('User not found');
  }
  
  // 2. ✅ VALIDA STATUS
  if (user.status === 'INACTIVE') {
    throw new UnauthorizedException('User account is inactive');
  }
  
  // 3. Enriquecer e renovar
  const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);
  const newAccessToken = this.jwtService.sign(enrichedPayload);
  return { accessToken: newAccessToken, refreshToken };
}
```

---

## 4. 🔴 **CRITICAL: Logging Expõe Dados Sensíveis (JWT tokens, passwords)**

### Problema
```typescript
// ❌ login.use-case.ts
this.logger.log(`[Login] SUCCES: userId=${user.id}, ...`);

// ❌ tenant-context.interceptor.ts
console.log(`[TenantContext] userId=${tenantContext.userId}, ...`);

// ❌ jwt-payload.service.ts
this.logger.debug(`[Enriching JWT] sub=${enrichedPayload.sub}, role=${enrichedPayload.role}`);

// Problema: Logs não devem conter sub/userIds em produção
// Stack traces podem expor:
// - User IDs (privacy)
// - JWT claims (security)
// - Organization structure (competitive info)
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Logs aparecem em CloudWatch/DataDog/Kibana
- Auditores veem usuários específicos
- Competidores veem estrutura de orgs

### Solução
```typescript
// ✅ FIX: Mascarar User IDs
this.logger.log(`[Login] Successful login for hashed account`);
// ❌ Não: this.logger.log(`userId=${user.id}`)

// ✅ Criar logger util
export class LoggerUtil {
  static hashUserId(userId: string): string {
    return userId.substring(0, 8) + '...';
  }
}

// ✅ FIX: login.use-case.ts
this.logger.log(`[Login] SUCCESS for user: ${LoggerUtil.hashUserId(user.id)}`);

// ✅ FIX: tenant-context.interceptor.ts (remover console.log)
// console.log(...) NUNCA em produção
// Usar logger.debug() com NEST_DEBUG=false em prod
```

---

## 5. 🔴 **CRITICAL: JWT Secret com Fallback Fraco**

### Problema
```typescript
// ❌ auth.module.ts
useFactory: (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET') || 'fallback-secret',
  signOptions: { expiresIn: '1h' },
})

// Se JWT_SECRET não está configurada, usa 'fallback-secret'
// Todos que souberem disso conseguem falsificar tokens
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Container esquecido sem JWT_SECRET pode usar fallback
- Qualquer desenvolvedor sabe o fallback
- Produção pode rodar com chave insegura silenciosamente

### Solução
```typescript
// ✅ FIX: auth.module.ts
useFactory: (configService: ConfigService) => {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set it in environment variables.');
  }
  return {
    secret,
    signOptions: { expiresIn: '1h' },
  };
},

// ✅ FIX: main.ts (adicionar validação)
async function bootstrap() {
  // Validar env vars obrigatórias
  const requiredEnvs = ['JWT_SECRET', 'DATABASE_URL', 'PORT'];
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  
  const app = await NestFactory.create(AppModule);
  // ...
}
```

---

## 6. 🔴 **CRITICAL: No Rate Limiting na Auth (Brute Force Attack)**

### Problema
```typescript
// ❌ Qualquer pessoa pode fazer milhões de tentativas de login
POST /auth/login
{ "email": "user@example.com", "password": "attempt1" }  // Falha
{ "email": "user@example.com", "password": "attempt2" }  // Falha
... (10 mil tentativas por segundo)

// Sem throttle/rate-limiting:
// - Força bruta de passwords
// - DDoS na API
// - Esgota DB com queries
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Account takeover (brute force passwords)
- DDoS (milhões de requests)
- Indisponibilidade de serviço

### Solução
```bash
# 1. Instalar throttler
npm install @nestjs/throttler

# 2. Config em app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 5,   // max 5 requests
      }
    ]),
    // ...
  ],
})
export class AppModule {}

# 3. Aplicar em auth endpoints
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5/min
  async login(@Body() loginDto: LoginDto) { ... }
  
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3/hour
  async register(@Body() registerDto: RegisterDto) { ... }
}
```

---

## 7. 🔴 **CRITICAL: Sem CORS/CSRF Protection**

### Problema
```typescript
// ❌ main.ts - NÃO tem CORS habilitado
const app = await NestFactory.create(AppModule);
// Sem app.enableCors({...})

// Resultado:
// 1. Browser bloqueia requisições de domains diferentes
// 2. Porém, problemas em produção:
//    - Mobile apps conseguem acessar (não respeita CORS)
//    - Qualquer servidor consegue fazer requests
//    - Sem proteção CSRF
```

### Risco
- ✅ **Severidade**: CRÍTICA
- CSRF attacks (forjar ações de usuários)
- Sem proteção de origin (qualquer app acessa)
- XSS pode fazer requests prejudiciais

### Solução
```typescript
// ✅ FIX: main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ Configurar CORS restrictivo
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });
  
  // ✅ Instalar helmet para headers de segurança
  // npm install @nestjs/helmet
  app.use(helmet());
  
  // ✅ CSRF Protection
  // npm install csurf
  
  // ... rest
}

// .env
CORS_ORIGINS=http://localhost:3000,https://movy.com,https://app.movy.com
```

---

## 8. 🔴 **CRITICAL: Password Validation Muito Fraca**

### Problema
```typescript
// ❌ register.dto.ts
@IsString()
@IsNotEmpty()
password: string;

// ❌ create-user.dto.ts
@IsString()
@IsNotEmpty()
@MinLength(8) // Apenas tamanho mínimo

// Aceita: "12345678" (não tem letra), "aaaaaaaa" (repetido)
// Nenhuma validação de:
// - Maiúsculas vs minúsculas
// - Números
// - Caracteres especiais (@#$etc)
// - Password history (repetição)
// - Common passwords (123456, password, etc)
```

### Risco
- ✅ **Severidade**: CRÍTICA
- Passwords fracas (força bruta fácil)
// - Violação LGPD (requisitos mínimos)
- Ataque de dicionário efetivo

### Solução
```typescript
// ✅ FIX: Criar validador customizado
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
        if (!/[@#$%^&*()_\-+=]/.test(value)) return false;
        
        // Não é password comum
        const commonPasswords = ['password', 'qwerty', 'letmein', 'welcome'];
        if (commonPasswords.includes(value.toLowerCase())) return false;
        
        return true;
      },
      defaultMessage() {
        return 'Password must have 12+ chars, uppercase, lowercase, number, symbol';
      }
    }
  });
}

// ✅ FIX: register.dto.ts
@IsStrongPassword()
password: string;
```

---

# 🟠 ALTO - ARQUITETURA & PERFORMANCE (12 Issues)

## 9. 🟠 **HIGH: OAuth/Refresh Token sem Blacklist (Token Revocation)**

### Problema
```
Admin desativa user
User ainda tem refresh token válido
User consegue novo access token indefinidamente
User nunca é "expulso"
```

### Risco
- Usuários desativados continuam acessando
- Admin não consegue fazer logout forçado
- Violação de compliance (PCI, GDPR)

### Solução
```typescript
// 1. Redis para token blacklist
npm install redis @nestjs/redis

// 2. Criar token blacklist service
@Injectable()
export class TokenBlacklistService {
  constructor(private redis: Redis) {}
  
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.redis.setex(`blacklist:${token}`, expiresIn, '1');
  }
  
  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redis.exists(`blacklist:${token}`);
    return exists === 1;
  }
}

// 3. Usar em JwtStrategy
async validate(payload: any): Promise<JwtPayload> {
  const token = this.extractTokenFromRequest(); // obter do header
  if (await this.blacklistService.isBlacklisted(token)) {
    throw new UnauthorizedException('Token has been revoked');
  }
  return payload;
}

// 4. Logout endpoint
@Post('logout')
async logout(@Req() req: Request): Promise<void> {
  const token = this.extractTokenFromHeader(req.headers.authorization);
  // Expiração: ler exp do JWT
  const decoded = this.jwtService.decode(token);
  const expiresIn = decoded.exp - (Date.now() / 1000);
  
  await this.blacklistService.blacklistToken(token, expiresIn);
}
```

---

## 10. 🟠 **HIGH: N+1 Queries em JwtPayloadService**

### Problema
```typescript
// ✅ jwt-payload.service.ts
async enrichPayload(userId: string): Promise<JwtPayload> {
  // Query 1: Buscar user
  const user = await this.userRepository.findById(userId);
  
  // Query 2: Buscar membership
  const membership = await this.membershipRepository.findFirstActiveByUserId(userId);
  
  // Query 3 (potencial): Se membership existe, buscar role
  // const role = await this.roleRepository.findById(membership.roleId);
  
  // Problema: Cada login = 2-3 queries
  // 1000 logins simultâneos = 2000-3000 queries no pico
  // PostgreSQL fica sobrecarregado
}

// Pior: refreshToken pode ser chamado com frequência
// Cada refresh = 2-3 queries
// User pode estar refreshando a cada minuto
```

### Risco
- Query storm em picos de traffic
- Latência de login > 500ms
- Escalabilidade limitada

### Solução
```typescript
// ✅ FIX: Usar query otimizada
async enrichPayload(userId: string): Promise<JwtPayload> {
  // ✅ Query ÚNICA com JOIN
  // SELECT u.*, m.*, r.name 
  // FROM users u
  // LEFT JOIN organization_memberships m ON m.user_id = u.id
  // LEFT JOIN roles r ON r.id = m.role_id
  // WHERE u.id = ? AND m.removed_at IS NULL
  
  const userWithMembership = await this.userRepository.findByIdWithMembership(userId);
  
  if (!userWithMembership) {
    throw new UnauthorizedException('User not found');
  }
  
  const { user, membership } = userWithMembership;
  
  // ... resto do código
  
  return enrichedPayload;
}

// ✅ Atualizar UserRepository
abstract findByIdWithMembership(userId: string): Promise<{
  user: User;
  membership: OrganizationMembership | null;
} | null>;
```

---

## 11. 🟠 **HIGH: Sem Validação de Entrada em Queries (SQL Injection potencial)**

### Problema
```typescript
// ❌ organization.controller.ts
@Get(':id')
async findById(@Param('id') id: string): Promise<OrganizationResponseDto> {
  // id vem como string do param
  // Se for UUID inválido, Prisma ainda tenta query
  // SELECT * FROM organization WHERE id = 'invalid-uuid'
  // Prisma lida bem, mas:
  // - Sem validação explícita de UUID format
  // - Sem rate limiting de requests "not found"
  
  const organization = await this.organizationRepository.findById(id);
  if (!organization) {
    throw new NotFoundException(...);
  }
  return this.organizationPresenter.toHTTP(organization);
}

// E' UUID injection potencial:
// GET /organizations/../../sensitive-data
// GET /organizations/1' OR '1'='1
// (embora Prisma mitigue, principio de defesa em profundidade)
```

### Risk
- Mesmo com Prisma ORM mitigando, sem validation explícita
- Possível enumeration (descobrir todos os IDs testando)
- Sem rate limiting em 404s

### Solução
```typescript
// ✅ FIX: Criar UUID pipe
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
  transform(value: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }
    return value;
  }
}

// ✅ Usar em controllers
@Get(':id')
async findById(
  @Param('id', UUIDValidationPipe) id: string
): Promise<OrganizationResponseDto> {
  // agora id é validado como UUID
  const organization = await this.organizationRepository.findById(id);
  // ...
}
```

---

## 12. 🟠 **HIGH: Sem Paginação Padrão (Força Bruta de Listagens)**

### Problema
```typescript
// ❌ user.controller.ts
@Get()
async findAll(): Promise<UserResponseDto[]> {
  // Retorna TODOS os usuários do sistema
  // GET /users → 10.000+ usuários
  // Network timeout, memory overflow no cliente
  
  const users = await this.findAllUsersUseCase.execute();
  return users.map(u => UserPresenter.toHTTP(u));
}

// Sem paginação obrigatória:
// - Força bruta listando todos (GDPR violation - lista de emails)
// - DDoS na API (requisição pode crashar)
// - Enumeração de usuários
```

### Risk
- Expose de lista completa de usuários/organizações
- DDoS (listar 100K registros)
- GDPR violation (acesso a PII)

### Solução
```typescript
// ✅ FIX: Implementar paginação padrão

// ✅ DTO
export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;
  
  @IsInt()
  @Min(1)
  @Max(100) // ← Max limit
  @Type(() => Number)
  @IsOptional()
  limit: number = 20;
}

// ✅ Controller
@Get()
async findAll(
  @Query() paginationDto: PaginationQueryDto
): Promise<PaginatedDto<UserResponseDto>> {
  const { page, limit } = paginationDto;
  const result = await this.findAllUsersUseCase.execute({
    page,
    limit,
    offset: (page - 1) * limit,
  });
  
  return new PaginatedDto(
    result.data.map(u => UserPresenter.toHTTP(u)),
    result.total,
    page,
    limit
  );
}
```

---

## 13. 🟠 **HIGH: E-test Coverage = 0%**

### Problema
```
0 testes unitários
0 testes de integração
0 testes E2E documentados
Sem coverage report
```

### Risk
- Qualquer change quebra algo
- Refatorações impossíveis
- Regression desconhecida
- Falta confiança em deploy

### Solução
```bash
# 1. Criar testes para auth module (crítico)
src/modules/auth/__tests__/
├── login.use-case.spec.ts
├── register.use-case.spec.ts
├── jwt-payload.service.spec.ts
└── jwt.strategy.spec.ts

# 2. Criar testes para guards
src/shared/guards/__tests__/
├── jwt.guard.spec.ts
└── roles.guard.spec.ts

# 3. Run tests
npm run test
npm run test:cov

# Target: 80% coverage mínimo para código crítico
```

---

## 14. 🟠 **HIGH: Soft Delete sem Auditoria (removedAt)**

### Problema
```typescript
// ✅ Usa soft delete com removedAt
user.removedAt = new Date();

// ❌ Mas sem tracking:
// - Não sabe QUEM deletou
// - Não sabe QUANDO exatamente
// - Sem reason/motivo
// - Sem audit log
```

### Risk
- Impossível rastrear quem deletou o quê
- GDPR compliance
- Forensics de segurança

### Solução
```typescript
// ✅ Adicionar campos de auditoria
model User {
  // ... existing fields
  
  // ✅ Soft delete com auditoria
  removedAt       DateTime?
  removedBy       String?        // userId que removeu
  removalReason   String?        // "user_requested", "admin_action", etc
  
  // ✅ Auditoria padrão
  createdAt       DateTime @default(now())
  createBy        String?
  updatedAt       DateTime @updatedAt
  updatedBy       String?
}

// ✅ Criar AuditLog table
model AuditLog {
  id              String @id @default(uuid())
  entityType      String  // "User", "Organization"
  entityId        String
  action          String  // "CREATE", "UPDATE", "DELETE"
  ChangedBy       String
  changes         Json    // Diff do que mudou
  createdAt       DateTime @default(now())
}
```

---

## 15. 🟠 **HIGH: Sem Validação de Email (Email Takeover)**

### Problema
```typescript
// ❌ register.dto.ts
@IsEmail()
@IsNotEmpty()
email: string;

// Problema:
// - Qualquer pessoa pode registrar com email de outro
// - Ninguém recebe confirmation email
// - User que registrou first ganha acesso
// - User real nunca consegue acessar

// POST /auth/register
// {
//   "email": "ceo@competitor.com",
//   "name": "Hacker",
//   "password": "..."
// }
// ✅ Problema! Hacker agora é "ceo"
```

### Risk
- Account takeover (registrar com email de CEO)
- Data exfiltration (acessar como outro user)
- GDPR violation (acesso não autorizado)

### Solução
```typescript
// ✅ Option 1: Email Verification (Recomendado)
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  // 1. Verificar se email já existe
  const existing = await this.userRepository.findByEmail(registerDto.email);
  if (existing) {
    throw new ConflictException('Email already registered');
  }
  
  // 2. Criar user com verified=false
  const user = await this.createUserUseCase.execute({
    ...registerDto,
    verificationToken: generateRandomToken(),
    verified: false,
  });
  
  // 3. Enviar email de confirmação
  await this.emailService.sendVerificationEmail(
    registerDto.email,
    user.verificationToken
  );
  
  return {
    message: 'Registration successful. Check your email to verify.',
    requiresVerification: true,
  };
}

// 4. Endpoint verify
@Post('verify-email/:token')
async verifyEmail(@Param('token') token: string) {
  const user = await this.userRepository.findByVerificationToken(token);
  if (!user) throw new BadRequestException('Invalid token');
  
  user.verified = true;
  user.verificationToken = null;
  await this.userRepository.save(user);
  
  return { message: 'Email verified successfully' };
}

// ✅ Option 2: Email whitelist (para MVP/testing)
export class RegisterDto {
  // ...
  @IsEmail()
  @Matches(/@(company\.com)$/, {
    message: 'Only company emails allowed'
  })
  email: string;
}
```

---

## 16. 🟠 **HIGH: Sem Helmet Headers (Clickjacking, XSS)**

### Problema
```typescript
// ❌ main.ts - sem helmet
// Resultado: Faltam security headers
// GET /
// Response Headers: NENHUM dos recomendados
```

### Risk
- Clickjacking (UI redressing)
- XSS (script injection)
- Content-sniffing
- Referrer leakage

### Solução
```bash
npm install @nestjs/helmet
```

```typescript
// ✅ main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Evitar unsafe-inline em prod
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' }, // Prevent clickjacking
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  
  // ...
}
```

---

## 17. 🟠 **HIGH: JWT Expiration Not Enforced Adequately**

### Problema
```typescript
// ✅ JwtModule config
signOptions: { expiresIn: '1h' },

// ❌ Mas refresh token NÃO tem expiração suficiente(?)
// Se refresh token dura 7 dias, user pode estar "logado" por 7 dias
// Sem re-validação de membership/status

// Além disso:
// - E se ninguém chamar refresh?
// - Token fica válido por 7 dias mesmo
```

### Risk
- User deletado continua acessando por 7 dias
- Membership revogada demora até 7 dias
- Violação de GDPR (direito de ser esquecido)

### Solução
```typescript
// ✅ FIX: Refresh tokens também expiram + revalidar
@Post('refresh')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10/min
async refresh(
  @Body('refreshToken') refreshToken: string,
  @Req() req: Request
): Promise<TokenResponseDto> {
  // 1. Verificar signature
  const payload = this.jwtService.verify(refreshToken);
  
  // 2. ✅ Revalidar user status completamente
  const user = await this.userRepository.findById(payload.sub);
  if (!user || user.status === 'INACTIVE') {
    throw new UnauthorizedException('User no longer valid');
  }
  
  // 3. ✅ Revalidar membership (pode ter sido removida)
  if (!payload.isDev) {
    const membership = await this.membershipRepository
      .findFirstActiveByUserId(user.id);
    if (!membership) {
      throw new UnauthorizedException('User no longer member of organization');
    }
  }
  
  // 4. Re-enrich e retornar novo token
  const enrichedPayload = await this.jwtPayloadService.enrichPayload(user.id);
  return {
    accessToken: this.jwtService.sign(enrichedPayload),
    refreshToken: this.jwtService.sign(enrichedPayload, { expiresIn: '7d' }),
  };
}
```

---

# 🟡 MÉDIO - BEST PRACTICES (6 Issues)

## 18. 🟡 **MEDIUM: Sem Exception Typing Específico**

### Problema
```typescript
// ❌ all-exceptions.filter.ts
catch(exception: unknown, host: ArgumentsHost) {
  // Exception é genérico "unknown"
  // Sem type safety
  // Perder informação de erro
  
  if (exception instanceof DomainError) { ... }
  else if (exception instanceof HttpException) { ... }
  else if (exception instanceof Error) { ... }
}

// Melhor: Tipagem específica
```

### Solução
```typescript
// ✅ Criar exception types
export class AppException extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export class AuthenticationException extends AppException {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_FAILED', 401, message);
  }
}

// ✅ Usar em filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: AppException | HttpException | Error, host: ArgumentsHost) {
    // Agora tipado corretamente
  }
}
```

---

## 19. 🟡 **MEDIUM: Sem Mappers de Resposta Consistentes**

### Problema
```typescript
// ❌ Inconsistência em diferentes controllers
// user.controller.ts retorna UserResponseDto
// organization.controller.ts retorna OrganizationResponseDto
// membership.controller.ts retorna direct entity

// Sem padrão de:
// - Metadata (total, page, limit)
// - Error format
// - Success response wrapper
```

### Solução
```typescript
// ✅ Criar response wrapper padrão
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

// ✅ Usar interceptor para wrapping
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      }))
    );
  }
}
```

---

## 20. 🟡 **MEDIUM: DTO sem Conversão de Tipos Numéricos**

### Problema
```typescript
// ❌ register.dto.ts
export class RegisterDto {
  @IsString()
  name: string;
  
  @IsEmail()
  email: string;
  
  @IsString()  // ← PROBLEMA: telephone como string
  @IsNotEmpty()
  telephone: string;  // Mas poderia vir como número do query param
                      // "1234567890" vs 1234567890
}

// GET /users?page=1&limit=10
// page e limit chegam como strings "1" e "10"
// Sem @Type(() => Number), ValidationPipe vira "1" (string)
```

### Risk
- Type inconsistency
- Query parsing falho
- Validação quebra

### Solução
```typescript
// ✅ FIX: Usar @Type() do class-transformer
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;
  
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

// main.ts - ValidationPipe já faz transform
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,  // ← Auto-converte baseado em @Type()
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

## 21. 🟡 **MEDIUM: Use Cases sem Transações (Atomicidade)**

### Problema
```typescript
// ❌ register.use-case.ts
async execute(registerDto: RegisterDto) {
  // Query 1: Create user
  const user = await this.userRepository.create(userDto);
  
  // Query 2: Create membership
  await this.membershipRepository.create(membershipDto);
  
  // ❌ Se Query 2 falhar, user creation não rollback
  // User fica sem membership (estado inconsistente)
}
```

### Risk
- Dados inconsistentes (orphan records)
- User sem org mas JWT esperando org
- Bug onde "partial create" deixa DB corrompida

### Solução
```typescript
// ✅ FIX: Usar transaction do Prisma
async execute(registerDto: RegisterDto) {
  return await this.prisma.$transaction(async (tx) => {
    // Ambas as queries dentro da transação
    // Se uma falhar, ambas rollback
    
    const user = await tx.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: await this.hashProvider.hash(registerDto.password),
        status: 'ACTIVE',
      },
    });
    
    if (registerDto.organizationId) {
      await tx.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: registerDto.organizationId,
          roleId: 1, // ADMIN
          removedAt: null,
        },
      });
    }
    
    return user;
  });
}
```

---

## 22. 🟡 **MEDIUM: Sem Tests/Validation de Soft Delete Query**

### Problema
```typescript
// ❌ user.repository.ts
async findAll(): Promise<User[]> {
  // ❌ RETORNA USERS DELETADOS TAMBÉM!
  return prisma.user.findMany();
}

// Correto seria:
async findAll(): Promise<User[]> {
  // ✅ Apenas não-deletados
  return prisma.user.findMany({
    where: { removedAt: null }
  });
}

// Problema: Inconsistência em diferentes queries
// Algumas retornam soft-deleted, outras não
```

### Risk
- Exposição de deletado users em listagens
- Bugs aleatórios (às vezes user aparece, às vezes não)
- Data leak (users devem ficar privados após delete)

### Solução
```typescript
// ✅ FIX: Criar base class para repositories
export abstract class SoftDeleteRepository<T> {
  protected getDefaultWhere() {
    return { removedAt: null };
  }
  
  async findAll(where?: Prisma.UserWhereInput): Promise<T[]> {
    return this.prisma.user.findMany({
      where: {
        ...this.getDefaultWhere(),
        ...where,
      },
    });
  }
  
  async findById(id: string): Promise<T | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        removedAt: null, // ← Sempre validar
      },
    });
  }
}

// ✅ Usar em repositories
@Injectable()
export class PrismaUserRepository extends SoftDeleteRepository<User> {
  // Herda getDefaultWhere() automaticamente
}
```

---

## 23. 🟡 **MEDIUM: Sem Validação de CreateOrganizationDto**

### Problema
```typescript
// ❌ create-organization.dto.ts (tentativa de observação)
export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Sem validação de tamanho
  
  // ❌ CNPJ - Sem validação de formato!
  @IsString()
  @IsNotEmpty()
  cnpj: string; // "123" é válido? "123.456.789-00" é?
  
  @IsString()
  @IsNotEmpty()
  slug: string; // Sem sanitização (XSS potencial)
  
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// Problema:
// - CNPJ inválido no banco de dados
// - Slug pode ter caracteres ruins (script injection?)
// - Nome pode ser gigante (memória)
```

### Risk
- Data validation issues
- XSS via slug
- Dados inválida (CNPJ fake)

### Solução
```typescript
// ✅ Criar validadores customizados
export function IsCNPJ(validationOptions?: ValidationOptions) {
  return registerDecorator({
    name: 'isCnpj',
    target: Object,
    propertyName: 'cnpj',
    options: validationOptions,
    validator: {
      validate(value: string) {
        // CNPJ validation logic
        const cnpj = value.replace(/[^\d]/g, '');
        if (cnpj.length !== 14) return false;
        
        // ... rest of validation
        return true;
      },
      defaultMessage() {
        return 'Invalid CNPJ format';
      }
    }
  });
}

// ✅ Usar em DTO
export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;
  
  @IsCNPJ()
  cnpj: string;
  
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9\-]+$/, { // Apenas lowercase, números, hífens
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  })
  slug: string;
  
  @IsEmail()
  email: string;
}
```

---

# 🟢 BAIXO - DOCUMENTAÇÃO (4 Issues)

## 24. 🟢 **LOW: .env.example Desatualizado**

### Problema
- Não existe `.env.example` no repo
- Novo dev não sabe quais vars precisar

### Solução
```bash
# Criar .env.example (commit ao git)
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@host:5432/movy
DIRECT_URL=postgresql://user:password@host:5432/movy

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=generate-strong-random-key-here
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
                                       
# Email (futura integração)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Redis (para token blacklist)
REDIS_HOST=localhost
REDIS_PORT=6379

# Dev
DEV_EMAILS=dev@company.com,admin@company.com
EOF

# Adicionar ao git
git add .env.example
git commit -m "docs: add env.example template"
```

---

## 25. 🟢 **LOW: README Incompleto (Setup Instructions)**

### Problema
- README não tem instruções claras de setup
- Novo dev leva 2 horas para rodar projeto

### Solução
```markdown
# Atualizar README.md

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (for token blacklist)

### Installation

1. Clone repo
   git clone https://github.com/movy/movy-api.git
   cd movy-api

2. Install dependencies
   npm install

3. Setup environment
   cp .env.example .env
   # Edit .env with your values

4. Setup database
   npx prisma migrate dev
   npx prisma db seed

5. Start server
   npm run start:dev

6. Access API
   - Swagger: http://localhost:3000/api
   - Health check: GET http://localhost:3000

### Running Tests
ns run test
npm run test:e2e
npm run test:cov
```

---

## 26. 🟢 **LOW: Architecture Decision Records (ADRs)**

### Problema
- Nenhuma documentação de decisões de arquitetura
- Por que JWT e não sesisons/OAuth?
- Por que Prisma e não TypeORM/MikroORM?
- Por que multi-tenant modelo?

### Solução
```markdown
# docs/architecture/adr-001-jwt-authentication.md

## ADR-001: JWT Authentication vs Session-Based

### Context
- Need to authenticate users
- API serves mobile + web clients
- May need to scale to multiple servers

### Decision
Use JWT (JSON Web Tokens) with refresh token pattern

### Consequences
- **Pros**:
  - Stateless (scales horizontally)
  - Mobile-friendly (no cookies)
  - Microservices-ready
  
- **Cons**:
  - Token revocation requires token blacklist (Redis)
  - Larger payloads than session ID
  - Compromised key = all tokens compromised

### Alternatives Considered
- Session-based (cookies) - requires shared session store
- OAuth2 - overkill for internal auth
- SAML - enterprise only

### Status
Accepted (April 2026)
```

---

## 27. 🟢 **LOW: Contributing Guidelines Missing**

### Problema
- Sem guia de contribuição
- Sem standards de código
- Sem workflow de PR

### Solução
```markdown
# CONTRIBUTING.md

## Code Standards
- Prettier: auto-format on commit
- ESLint: strict rules
- NestJS style guide

## Commit Messages
  feat: Add new feature
  fix: Bug fix
  docs: Documentation
  test: Add tests
  refactor: Code refactoring
  perf: Performance

## PR Checklist
- [ ] Tests pass (npm run test)
- [ ] Coverage > 80%
- [ ] No console.logs in prod code
- [ ] Updated README if needed
- [ ] No secrets in code

## Security Review
- All security-related PRs require 2 approvals
- Use `@security-team` for security reviews
```

---

# 📋 RESUMO EXECUTIVO

| # | Severidade | Issue | Impacto | Esforço | Prioridade |
|----|-----------|-------|--------|--------|-----------|
| 1 | 🔴 CRÍTICO | Credenciais em .env | Breach, acesso não autorizado | 1h | P0 |
| 2 | 🔴 CRÍTICO | Register sem Membership | User sem acesso | 2h | P0 |
| 3 | 🔴 CRÍTICO | Refresh Token sem User Status Check | User inativo acessa | 1h | P0 |
| 4 | 🔴 CRÍTICO | Logging expõe dados sensitivos | Privacy leak | 3h | P0 |
| 5 | 🔴 CRÍTICO | JWT Secret com fallback fraco | Token forgery | 1h | P0 |
| 6 | 🔴 CRÍTICO | Sem Rate Limiting na Auth | Brute force attack | 2h | P0 |
| 7 | 🔴 CRÍTICO | Sem CORS/Helmet | CSRF, XSS, clickjacking | 2h | P0 |
| 8 | 🔴 CRÍTICO | Password muito fraca | Account takeover | 2h | P0 |
| 9 | 🟠 ALTO | Sem Token Blacklist | User não consegue logout | 3h | P1 |
| 10 | 🟠 ALTO | N+1 Queries em JWT Enrichment | Escalabilidade | 2h | P1 |
| 11 | 🟠 ALTO | Sem Validação de UUID | Enumeration | 1h | P1 |
| 12 | 🟠 ALTO | Sem Paginação Padrão | 0% test coverage | 8h | P1 |
| 13 | 🟠 ALTO | 0% Test Coverage | Regression desconhecida | 16h | P1 |
| 14 | 🟠 ALTO | Soft Delete sem Auditoria | Compliance issue | 3h | P2 |
| 15 | 🟠 ALTO | Sem Email Verification | Email takeover | 4h | P1 |
| 16 | 🟠 ALTO | Sem Helmet Headers | Security headers faltam | 1h | P1 |
| 17 | 🟠 ALTO | JWT Expiration não Enforced | User deletado acessa 7 dias | 2h | P1 |
| 18 | 🟡 MÉDIO | Exception Typing | Type safety | 2h | P2 |
| 19 | 🟡 MÉDIO | Response Mapping inconsistente | API inconsistência | 3h | P2 |
| 20 | 🟡 MÉDIO | DTO sem Type Conversion | Query parsing | 1h | P2 |
| 21 | 🟡 MÉDIO | Sem Transactions | Data inconsistência | 2h | P2 |
| 22 | 🟡 MÉDIO | Soft Delete Query Bug | Data leak | 2h | P2 |
| 23 | 🟡 MÉDIO | CreateOrgDto sem Validação | Invalid data | 3h | P2 |
| 24 | 🟢 BAIXO | .env.example desatualizado | Onboarding | 1h | P3 |
| 25 | 🟢 BAIXO | README incompleto | Documentação | 2h | P3 |
| 26 | 🟢 BAIXO | ADRs faltam | Decision tracking | 3h | P3 |
| 27 | 🟢 BAIXO | Contributing guide falta | Standards | 2h | P3 |

---

## 📈 ROADMAP DE FIXES (Ordem de Prioridade)

### 🚨 SPRINT 0 - CRÍTICO (24h)
- ✅ [1h] Move credenciais para .env.local (git-ignored)
- ✅ [2h] Fix Register para criar membership
- ✅ [1h] Fix Refresh Token com user status check
- ✅ [3h] Remover logs sensíveis (JWT tokens, user IDs)
- ✅ [1h] Enforce JWT_SECRET (sem fallback)
- ✅ [2h] Implementar Rate Limiting (@nestjs/throttler)
- ✅ [2h] Adicionar CORS + Helmet
- ✅ [2h] Validação de password forte
- ✅ [8h] Escrever testes (cobertura >80%)

### 📊 SPRINT 1 - ALTO (20h)
- [ ] Implementar token blacklist com Redis
- [ ] Otimizar JWT enrichment (eliminar N+1)
- [ ] Add UUID validation pipe
- [ ] Implementar paginação padrão
- [ ] Email verification
- [ ] Helmet security headers
- [ ] JWT expiration revalidation
- [ ] Transações para operações críticas

### 🎯 SPRINT 2 - MÉDIO (15h)
- [ ] Exception typing
- [ ] Response mapper padrão
- [ ] Type conversion em DTOs
- [ ] Soft delete query validation
- [ ] Validação de CreateOrgDto
- [ ] Audit logging

### 📚 SPRINT 3 - DOCUMENTAÇÃO (8h)
- [ ] .env.example
- [ ] README complete
- [ ] ADRs
- [ ] Contributing guide

---

## 🎯 CONCLUSÃO

### Estado Atual
- **Architecture**: 8/10 (boa estrutura, mas precisa de refinamentos)
- **Security**: 4/10 (críticos faltando)
- **Testing**: 0/10 (nenhum teste)
- **Documentation**: 5/10 (bom, mas incompleto)
- **Scalability**: 5/10 (N+1 queries, sem pagination)

### Recomendação
**NÃO fazer deploy em produção até:**
1. ✅ Todas as issues CRÍTICAS (8) serem resolvidas
2. ✅ Cobertura de testes >80% para código crítico
3. ✅ CORS + Rate Limiting habilitados
4. ✅ Credenciais seguras (.env.example, secrets manager)

### Timeline Estimado
- **CRÍTICO**: 24h (1 sprint)
- **TOTAL (P0+P1)**: 44h (2 sprints)
- **TOTAL (All)**: 75h (está bem, já que P3 é baixo)

### Pontos Fortes
- ✅ Arquitetura modular (DDD)
- ✅ Decoradores bem implementados
- ✅ Soft delete pattern
- ✅ JWT enrichment service (bom design)
- ✅ Exception filter global
- ✅ Swagger docs

### Pontos Fracos
- ❌ Sem testes
- ❌ Segurança incompleta (CORS, rate-limit, helmet)
- ❌ Credenciais expostas
- ❌ Password validation fraca
- ❌ Sem email verification

---

**Gerado por**: Senior Developer Review  
**Data**: 9 de Abril de 2026  
**Projeto**: Movy API v0.0.1
