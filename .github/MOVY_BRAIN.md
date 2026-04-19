# MOVY_BRAIN.md — Knowledge Skill File

> Fonte única de verdade do projeto. Lido pelo Copilot em cada sessão.  
> Última atualização: 19 Abr 2026

---

## 1. O QUE É ESSE PROJETO

**Movy API** — backend SaaS multi-tenant para gerenciamento de transporte coletivo e viagens recorrentes.  
Organizações (empresas de transporte) cadastram frotas, motoristas, rotas e passageiros.  
É um **TCC** com MVP alvo para Jul/Ago 2026.

Stack: **NestJS v11 + TypeScript 5.7 strict + Prisma v7 + PostgreSQL 17 + Docker + JWT + Bcrypt**

---

## 2. ARQUITETURA — REGRAS QUE NÃO SE DOBRAM

### Camadas por módulo
```
src/modules/<módulo>/
├── application/
│   ├── dtos/           → CreateXDto, UpdateXDto, XResponseDto (arquivos separados)
│   └── use-cases/      → Um arquivo por use-case
├── domain/
│   ├── entities/       → XEntity com props object pattern, getters públicos, static factory create()/restore()
│   ├── errors/         → X.errors.ts — todos os domain errors do módulo
│   ├── value-objects/  → ValueObjects com static create() e .value_ getter
│   └── interfaces/     → IXRepository
├── infrastructure/
│   └── db/
│       ├── mappers/    → XMapper: toDomain() e toPersistence()
│       └── repositories/ → PrismaXRepository implementando IXRepository
├── presentation/
│   ├── controllers/    → XController
│   └── mappers/        → XPresenter com métodos estáticos toHTTP() / toHTTPList()
└── X.module.ts
```

### Regras da camada de domínio
- Use cases lançam **domain errors** — NUNCA `HttpException` do NestJS
- `AllExceptionsFilter` mapeia códigos de erro de domínio para HTTP status
- Sufixos de código de erro que mapeiam HTTP:
  - `_NOT_FOUND` → 404
  - `_CONFLICT` / `_ALREADY_EXISTS` → 409
  - `_BAD_REQUEST` → 400
  - `_FORBIDDEN` → 403
  - `_UNAUTHORIZED` → 401
  - sem sufixo reconhecido → 500
- Value Objects: immutable, `static create(value)` retorna instância ou lança `ValidationError`, getter `.value_`
- Entidades: props privadas via `DriverProps`-like interface, `static create()` para novos, `static restore()` para hidratar do banco

### Repositórios — contrato padrão
```typescript
save(entity: XEntity): Promise<XEntity | null>
update(entity: XEntity): Promise<XEntity | null>
delete(id: string): Promise<void>
findById(id: string): Promise<XEntity | null>
findAll(options: PaginationOptions): Promise<PaginatedResponse<XEntity>>
```

### Paginação — tipos globais em shared
```typescript
interface PaginationOptions { page: number; limit: number }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number }
```

---

## 3. MÓDULOS IMPLEMENTADOS (FASE 1 — 100% COMPLETO)

### 3.1 User Module ✅
- CRUD completo + Soft Delete (status → INACTIVE)
- Value Objects: `Email`, `UserName`, `Telephone`
- Endpoints: `POST /users`, `GET /users` (paginado), `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- `GET /users` é `@Dev()` — apenas devs têm acesso à listagem global

### 3.2 Auth Module ✅
- **Endpoints:**
  - `POST /auth/login` — retorna `{ accessToken, refreshToken, user }`
  - `POST /auth/register` — cria usuário
  - `POST /auth/refresh` — body: `RefreshTokenDto { refreshToken: string }`
  - `POST /auth/register-organization` — fluxo completo: cria user + org + membership ADMIN + tokens
  - `POST /auth/setup-organization` — usuário já autenticado (sem org) cria org, retorna novo JWT com `organizationId`
- **JWT Strategy**: não consulta banco a cada request — confia no payload enriquecido
- **Payload JWT**: `{ sub: userId, email, organizationId, role, isDev }`
- `RegisterOrganizationWithAdminUseCase`: orquestrador com compensação em 2 estágios (rollback de user se org ou membership falhar)
- `AuthModule` **NÃO** é `@Global()` — exporta JwtStrategy, PassportModule, JwtModule

### 3.3 Organization Module ✅
- CRUD completo + Soft Delete
- `POST /organizations` é `@Dev()` — criação real é via `/auth/register-organization`
- Value Objects: `Cnpj`, `OrganizationName`, `Slug` (auto-gerado), `Address`, `Email`, `Telephone`
- Domain Errors: `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`, `OrganizationForbiddenError` (→ HTTP 403)
- **Zero acoplamento** com MembershipModule: `OrganizationModule` importa apenas `SharedModule`
- `TenantContextParams` centralizado em `application/dtos/index.ts`

### 3.4 Membership Module ✅ (security hardened)
- Gerencia `OrganizationMembership` (userId + roleId + organizationId como PK composta)
- **Soft Delete** via `removedAt`
- **Endpoints:**
  - `POST /memberships` — `organizationId` vem do JWT (nunca do body)
  - `GET /memberships/user/:userId` — filtrado pela org do caller (não-devs não veem dados de outras orgs)
  - `GET /memberships/organization/:organizationId`
  - `GET /memberships/:userId/:roleId/:organizationId`
  - `PATCH /memberships/:userId/:roleId/:organizationId/restore`
  - `DELETE /memberships/:userId/:roleId/:organizationId`
- `CreateMembershipDto`: apenas `{ userEmail: string, roleId: number }`
- **Validação de prerequisito DRIVER**: antes de criar membership com roleId=DRIVER, verifica se usuário tem perfil `Driver` — validação ocorre ANTES do check de soft-delete (previne bypass)
- Domain Errors: `MembershipAlreadyExistsError`, `MembershipNotFoundError`, `DriverNotFoundForMembershipError` (→ HTTP 400)

### 3.5 Driver Module ✅ (redesenhado 15 Abr)
- **Driver é entidade global** — sem `organizationId` no model. Vínculo com org é via `OrganizationMembership`
- **Fluxo de onboarding de motorista:**
  1. `POST /drivers` — self-service, `userId` vem do JWT
  2. `GET /drivers/lookup?email=x&cnh=y` — admin verifica identidade (ADMIN only)
  3. `POST /memberships` com `roleId=DRIVER` — admin vincula motorista à org
- **Endpoints:**
  - `POST /drivers` — self-service (qualquer autenticado), check de duplicata → `DriverAlreadyExistsError` (HTTP 409)
  - `GET /drivers/me` — perfil do driver autenticado
  - `GET /drivers/lookup?email=&cnh=` — ADMIN only, email e cnh não podem ser vazios
  - `GET /drivers/organization/:organizationId` — via JOIN: `user.userRoles.some({ organizationId, role.name: DRIVER })`
  - `GET /drivers/:id`, `PUT /drivers/:id`, `DELETE /drivers/:id`
- Value Objects: `Cnh` (9-12 chars alfanuméricos), `CnhCategory` (enum A-E)
- Domain Errors: 11+ tipos incluindo `DriverAlreadyExistsError`, `DriverProfileNotFoundByEmailError`
- `DriverModule` importa `UserModule` (para `UserRepository` no LookupDriverUseCase)
- `findByCnh()` disponível no `DriverRepository`

### 3.6 Role Management ✅
- Roles pré-definidos: `ADMIN`, `DRIVER`
- Seed automático no startup do Docker via `prisma/seed.ts`
- `upsert` garante idempotência

### 3.7 Vehicle Module ✅ (implementado 17 Abr)
- CRUD completo + Soft Delete (status → INACTIVE)
- Multi-tenant: `organizationId` obrigatório
- Value Objects: `Plate` (formato brasileiro)
- Endpoints:
  - `POST /organizations/:organizationId/vehicles` — ADMIN only
  - `GET /organizations/:organizationId/vehicles` — paginado
  - `GET /vehicles/:id` — detalhe
  - `PUT /vehicles/:id` — atualizar
  - `DELETE /vehicles/:id` — soft delete
- Domain Errors: `VehicleNotFoundError`, `VehicleAlreadyExistsError`
- `VehicleModule` importa apenas `SharedModule`

---

## 4. RBAC — PIPELINE DE GUARDS

```
Request → JwtAuthGuard (valida JWT, popula req.user E req.context)
        → RolesGuard   (lê @Roles(), compara ctx.role)
        → TenantFilterGuard (valida :organizationId === ctx.organizationId)
        → DevGuard     (lê @Dev(), verifica ctx.isDev)
        → Controller
```

### TenantContext interface (centralizada em `src/shared/infrastructure/types/tenant-context.interface.ts`)
```typescript
interface TenantContext {
  userId: string
  organizationId: string | null
  role: RoleName | null
  isDev: boolean
}
```

### Guards
| Guard | Arquivo | Pergunta |
|-------|---------|----------|
| `JwtAuthGuard` | `guards/jwt.guard.ts` | "Está autenticado?" + popula `req.context` |
| `RolesGuard` | `guards/roles.guard.ts` | "Tem o role certo?" — devs pulam |
| `TenantFilterGuard` | `guards/tenant-filter.guard.ts` | "Pertence a essa org?" — devs pulam |
| `DevGuard` | `guards/dev.guard.ts` | "É dev?" — sem bypass |

### Decorators
- `@Roles(RoleName.ADMIN)` — define roles requeridas na rota
- `@Dev()` — marca rota como exclusiva para devs
- `@GetUser()` — extrai `req.user` / `req.context` no controller

### Identificação de Devs
`DEV_EMAILS` env var (CSV de emails). Populado no JWT no momento do login. `isDev=true` no payload → bypass automático de RolesGuard e TenantFilterGuard.

---

## 5. SCHEMA PRISMA — MODELOS E RELAÇÕES

```
Plan ──────────────── Subscription ──── Organization
                                            │
                                            ├── OrganizationMembership (userId, roleId, organizationId) PK composta
                                            │       ├── User (via userId)
                                            │       └── Role (via roleId)
                                            │
                                            ├── Vehicle
                                            ├── TripTemplate ────── TripInstance ──── Enrollment ──── Payment
                                            │                           │
                                            │                       Driver (via driverId) ← User (1:1)
                                            │                       Vehicle (via vehicleId)
                                            └── AuditLog
```

### Enums do Schema
- `Status`: ACTIVE | INACTIVE
- `DriverStatus`: ACTIVE | INACTIVE | SUSPENDED
- `RoleName`: ADMIN | DRIVER
- `TripStatus`: SCHEDULED | AWAITING_DECISION | CONFIRMED | IN_PROGRESS | FINISHED | CANCELED
- `RouteType`: ONE_WAY | RETURN | ROUND_TRIP
- `DayOfWeek`: SUNDAY…SATURDAY
- `Shift`: MORNING | AFTERNOON | EVENING
- `VehicleType`: VAN | BUS | MINIBUS | CAR
- `PlanName`: FREE | BASIC | STANDARD | PREMIUM
- `SubscriptionStatus`: ACTIVE | CANCELED | PAST_DUE
- `PaymentStatus`: PENDING | COMPLETED | FAILED
- `MethodPayment`: MONEY | PIX | CREDIT_CARD | DEBIT_CARD

### Pontos críticos do schema
- `Driver.userId` é `@unique` — 1:1 com User. Um usuário tem no máximo 1 perfil de motorista
- `OrganizationMembership` tem PK `@@id([userId, roleId, organizationId])` — previne duplicatas
- `TripInstance.totalCapacity` é snapshot do veículo no momento do agendamento (histórico)
- `Enrollment` tem `boardingStop` e `alightingStop` (paradas de embarque/desembarque)
- `Driver` **não tem** `organizationId` (removido em 15 Abr 2026)
- `TripInstance` → `Driver`/`Vehicle` usa `onDelete: Restrict` (protege histórico financeiro)
- `TripInstance` tem `@@unique([tripTemplateId, departureTime])` (previne instâncias duplicadas)
- `TripTemplate.stops` é `String[]` — decisão de MVP, sem tabela dedicada. `boardingStop`/`alightingStop` no Enrollment são referências por string
- `TripTemplate` tem 3 campos de preço opcionais (`priceOneWay`, `priceReturn`, `priceRoundTrip`) — validação de obrigatoriedade conforme `routeType` fica no app layer
- `statusForRecurringTrip` foi **removido** de `TripInstance` (19 Abr 2026) — usar `tripStatus: CANCELED` para instâncias individuais ou `TripTemplate.status: INACTIVE` para pausar série

---

## 6. SHARED MODULE — O QUE EXPORTA

```
src/shared/
├── domain/
│   ├── types/index.ts            → PaginationOptions, PaginatedResponse, Status types
│   ├── errors/validation.error.ts → ValidationError base
│   └── entities/value-objects/   → Email, Telephone (compartilhados)
├── infrastructure/
│   ├── database/                 → PrismaModule, PrismaService
│   ├── decorators/               → dev.decorator.ts, get-user.decorator.ts, roles.decorator.ts
│   ├── guards/                   → jwt.guard.ts, roles.guard.ts, tenant-filter.guard.ts, dev.guard.ts
│   └── types/                    → tenant-context.interface.ts
├── presentation/
│   └── interceptors/             → LoggingInterceptor
│   └── filters/                  → AllExceptionsFilter
├── providers/                    → BcryptProvider, JwtPayloadService
└── shared.module.ts              → exporta tudo acima
```

---

## 7. CONVENÇÕES DE CÓDIGO

### Criando um novo use-case
```typescript
// src/modules/X/application/use-cases/create-x.use-case.ts
@Injectable()
export class CreateXUseCase {
  constructor(
    @Inject(X_REPOSITORY_TOKEN)
    private readonly xRepository: IXRepository,
  ) {}

  async execute(dto: CreateXDto, context: TenantContextParams): Promise<XResponseDto> {
    // 1. Validar/criar value objects (lança ValidationError se inválido)
    // 2. Checar duplicatas via repository
    // 3. Criar entidade com XEntity.create(props)
    // 4. Salvar via repository
    // 5. Retornar via XPresenter.toHTTP(entity)
  }
}
```

### Criando um domain error
```typescript
// src/modules/X/domain/errors/x.errors.ts
export class XNotFoundError extends Error {
  readonly code = 'X_NOT_FOUND'  // sufixo determina HTTP status
  constructor(id: string) {
    super(`X with id ${id} not found`)
  }
}
```

### AllExceptionsFilter — mapeamento de códigos
O filtro lê `error.code` e usa regex/includes para determinar o status HTTP:
- `/_NOT_FOUND$/` → 404
- `/_CONFLICT$|_ALREADY_EXISTS$/` → 409
- `/_BAD_REQUEST$/` → 400
- `/_FORBIDDEN$/` → 403
- `/_UNAUTHORIZED$/` → 401

### DTOs
- `class-validator` para validação
- `@ApiProperty` / `@ApiPropertyOptional` do `@nestjs/swagger` em todos os campos
- Body de request em arquivos separados de response DTO
- `PartialType(CreateXDto)` para `UpdateXDto`

### Presenters
```typescript
export class XPresenter {
  static toHTTP(entity: XEntity): XResponseDto { ... }
  static toHTTPList(entities: XEntity[]): XResponseDto[] { ... }
}
```

---

## 8. SEGURANÇA — PONTOS CRÍTICOS

- `organizationId` nunca vem do body em rotas autenticadas — sempre do JWT (`req.context.organizationId`)
- Senhas com Bcrypt (salt rounds configurável)
- Rate limiting global: `@nestjs/throttler` — 60 req/min via APP_GUARD
- `ForbiddenException` do NestJS **nunca** dentro de use-cases — usar domain errors
- `import type` para imports de tipo (isolamento em compile time)
- `strict: true` no tsconfig — sem `any` na mão, sem `!` desnecessário

---

## 9. VARIÁVEIS DE AMBIENTE

```env
DATABASE_URL="postgresql://docker:docker07@postgres:5432/movy?schema=public"
PORT=5700 (para o docker, 5701 para dev local) 
JWT_SECRET="your_jwt_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
DEV_EMAILS="dev@movy.com,admin@dev.com"   # CSV, whitelist de devs
```

---

## 10. COMANDOS ÚTEIS

```bash
npm run start:dev                # dev server
npx tsc --noEmit                 # check TS sem buildar
npx prisma migrate dev --name X  # nova migration
npx prisma generate              # regenerar client após schema change
npx prisma studio                # GUI do banco
npm run db:seed                  # seed manual
docker-compose up --build        # sobe tudo + seed automático
npm run test                     # unit tests (Jest)
```

---

## 11. FASE ATUAL E PRÓXIMOS PASSOS

**Status:** Fase 1 + Vehicle 100% concluídos (19 Abr 2026). Fase 2 em andamento.

### Próximo módulo: Trip Module (COMPLEXO)
- `TripTemplate` — modelo de rota recorrente (`frequency: DayOfWeek[]`, `shift`, `stops: String[]`)
- `TripInstance` — execução específica de uma trip, com `driver`, `vehicle`, `departureTime`
- Decisões de schema já tomadas:
  - `onDelete: Restrict` em Driver/Vehicle → protege histórico
  - `@@unique([tripTemplateId, departureTime])` → previne duplicatas de scheduler
  - `statusForRecurringTrip` removido → `tripStatus` é fonte única de verdade
  - 3 campos de preço opcionais no template → validação no app layer
  - `stops: String[]` (MVP) → sem tabela dedicada de paradas
- Auto-geração de instâncias a partir de templates (scheduler futuro)

### Depois: Booking/Enrollment Module
- `Enrollment` — inscrição de passageiro em `TripInstance`
- `Payment` — pagamento associado ao enrollment
- Validação de capacidade (`totalCapacity` snapshot do veículo)

### Pendente em todos os módulos
- Testes unitários (vehicle sem testes ainda)
- CI/CD GitHub Actions

---

## 12. ARMADILHAS CONHECIDAS (não cair de novo)

1. **Guards rodam DEPOIS do JwtAuthGuard** — `req.context` só existe após a validação do JWT. Nunca usar middleware para ler `req.user`.
2. **`organizationId` do body = vulnerabilidade** — sempre extrair do JWT em rotas autenticadas.
3. **Driver sem org no schema** — `Driver` não tem `organizationId`. Busca por org usa JOIN via `OrganizationMembership`.
4. **`OrganizationModule` sem deps de `MembershipModule`** — acoplamento foi removido. Orquestração fica no Auth Module.
5. **Validação de prerequisito Driver antes do soft-delete check** — ordem importa para prevenir bypass.
6. **`AuthModule` não é `@Global()`** — importar explicitamente onde necessário.
7. **Sufixo do `error.code`** determina HTTP status — sem sufixo reconhecido → 500 em produção.
8. **`@types/passport-jwt`** é devDependency, não dependency.
9. **`movy_db_data/`** está no `.gitignore` — não commitar dados do Postgres local.
10. **`RefreshTokenDto`** existe — não usar `@Body('refreshToken')` bare string.
11. **`onDelete: Cascade` em Driver/Vehicle → TripInstance`** deletava histórico financeiro. Corrigido para `Restrict` em 19 Abr 2026.
12. **`statusForRecurringTrip`** era state duplicado com `tripStatus`. Removido em 19 Abr 2026 — usar `tripStatus: CANCELED` ou `TripTemplate.status: INACTIVE`.
13. **Preços nullable no TripTemplate** — pelo menos o preço do `routeType` deve ser non-null. Validar no use case, não no schema.
