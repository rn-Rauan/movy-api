# 📊 Progresso do Projeto

> Checklist de desenvolvimento por módulo. Update conforme vai terminando features.

**Última atualização:** 16 Mai 2026

---

## 📈 Resumo Geral

```
Total Módulos: 10
Completo: 10 (100%) - User, Organization, Role Management, Membership, Driver, RBAC Guards, Auth, Vehicle, Trip, Bookings
Em Progresso: 0
Pendente: 0

Mitigações críticas (29 Abr): Payment simulation ✅ | Subscription lazy expiration ✅ | Plan limits enforcement ✅ | Auto-FREE subscription ✅
Trip Scheduling (16 Mai): Fase 1 — hora-do-dia no TripTemplate ✅ | Fase 2 — TripSchedulingConfig per-org ✅ | Fase 3 — Cron de auto-cancel (*/15min, UTC) ✅ | Fase 4 — Cron de geração recorrente (0 2 * * *, UTC) ✅ | Fase 5 ⏳
Testes: 45 suites, 354 testes ✅ | TypeScript: 0 erros ✅
```

---

## ✅ FASE 1: Fundação (Mar 2026)

### Role Management ✅ COMPLETO (05 Abr 2026)
- ✅ Entity Role (ADMIN, DRIVER)
- ✅ Role Repository pattern
- ✅ Role Mapper (Entity ↔ DTO)
- ✅ Database seeding script
- ✅ Seed automático no Docker
- ✅ Value Objects com validações
- ✅ Validation Errors para domínio

**Status:** Funcional e integrado ao SharedModule

---

### Shared Module ✅ COMPLETO (05 Abr 2026)
- ✅ Module padronizado para exports
- ✅ Orchestração de componentes globais (PrismaModule, Guards, Interceptors, Filters)
- ✅ Database seeding integration
- ✅ Value Objects centralizados (Email, Telephone)
- ✅ Domain Errors e Validation Errors
- ✅ JWT Guard compartilhado
- ✅ Logging Interceptor global
- ✅ Exception Filter global

**Arquivos criados:**
```
src/shared/
├── shared.module.ts ✅
├── index.ts ✅
├── domain/
│   ├── types/index.ts ✅
│   ├── errors/validation.error.ts ✅
│   └── entities/value-objects/ ✅
└── (outros componentes já existentes)
```

**Status:** Padrão estabelecido para reutilização em outros módulos

---

### Membership Module ✅ COMPLETO (05 Abr 2026) | 🔄 Security Hardening (14 Abr 2026)
- ✅ Entity Membership com chave composta (userId, roleId, organizationId)
- ✅ Repository pattern com PrismaMembershipRepository
- ✅ Mapper para conversão domínio ↔ persistência
- ✅ Use Cases: Create, FindByCompositeKey, FindByUser, FindByOrganization, Remove, Restore
- ✅ Controller REST com endpoints CRUD (POST, GET, DELETE, PATCH)
- ✅ Soft delete via removedAt
- ✅ Paginação em listagens
- ✅ Tratamento de erros específicos (MembershipAlreadyExistsError, MembershipNotFoundError)
- ✅ Presenter para respostas HTTP
- ✅ Integração com SharedModule (Prisma, Guards)
- ✅ **[14 Abr]** `CreateMembershipDto` simplificado: apenas `{ userEmail: string, roleId: number }` — `userId?` e `organizationId` removidos do body
- ✅ **[14 Abr]** Isolamento de tenant em `POST /memberships`: `organizationId` vem exclusivamente do JWT
- ✅ **[14 Abr]** `GET /memberships/user/:userId` filtrado pela org do caller (não-devs não vêem dados de outras orgs)
- ✅ **[14 Abr]** Validação de prerequisito Driver: ROLE DRIVER requer perfil `Driver` existente e associado à org
- ✅ **[14 Abr]** `DriverNotFoundForMembershipError` (código `DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST` → HTTP 400)
- ✅ **[14 Abr]** `DriverNotAssociatedWithOrganizationError` (código `DRIVER_NOT_IN_ORGANIZATION_BAD_REQUEST` → HTTP 400)
- ✅ **[14 Abr]** Ordem de validação corrigida: Driver validado ANTES do check de soft-delete (previne bypass)
- ✅ **[15 Abr]** `DriverNotAssociatedWithOrganizationError` removido (não mais necessário após redesign do Driver)
- ✅ **[15 Abr]** Validação de prerequisito Driver simplificada: verifica apenas existência de perfil Driver (sem check de org)
- ✅ **[16 Abr]** Testes unitários do `CreateMembershipUseCase` — 7 testes (happy path ADMIN, happy path DRIVER, restore soft-deleted, user not found, driver profile missing, membership already exists)
- ✅ **[21 Abr]** `GET /memberships/me/role/:organizationId` — endpoint para ADMIN e DRIVER consultarem sua própria role dentro de uma organização (`FindRoleByUserIdAndOrganizationIdUseCase` exposto via HTTP)
- ✅ **[21 Abr]** `RoleResponseDto` criado (`{ id, name: RoleName }`) com Swagger
- ✅ **[21 Abr]** `FindRoleByUserIdAndOrganizationIdUseCase` injetado no `MembershipController` (sem `TenantFilterGuard` — isolamento implícito pelo `userId` do token)

**Arquivos criados:**
```
src/modules/membership/
├── membership.module.ts ✅
├── application/dtos/ ✅ (+ role-response.dto.ts — 21 Abr)
├── application/use-cases/ ✅
├── domain/entities/ ✅
├── domain/errors/ ✅
├── domain/interfaces/ ✅
├── infrastructure/db/mappers/ ✅
├── infrastructure/db/repositories/ ✅
├── presentation/controllers/ ✅ (+ GET /me/role/:organizationId — 21 Abr)
├── presentation/mappers/ ✅
└── README.md ✅

test/modules/membership/
├── factories/membership.factory.ts ✅ (makeMembership com suporte a removedAt)
└── application/use-cases/create-membership.use-case.spec.ts ✅ (7 testes)
```

**Status:** Funcional, integrado e testado. ✅

---

### Driver Module ✅ COMPLETO (11 Abr 2026) | 🔄 Redesign Arquitetural (15 Abr 2026)
- ✅ Entity DriverEntity com Value Objects (Cnh, CnhCategory)
- ✅ Value Objects com validação completa
  - Cnh: Validação de 9-12 caracteres alfanuméricos
  - CnhCategory: Enum A-E com validação
- ✅ DriverMapper com hidratação de value objects
- ✅ Domain Errors (11+ tipos de erro específicos, incluindo DriverAlreadyExistsError — novo 15 Abr)
- ✅ Repository pattern (DriverRepository, PrismaDriverRepository)
- ✅ Use Cases (7 total): Create, Update, FindById, FindByUserId, FindByOrganization, Remove, **Lookup** *(novo 15 Abr)*
- ✅ DTOs com @ApiProperty decorators (create, update, response, **lookup-response** *(novo 15 Abr)*)
- ✅ Controller com endpoints REST (POST, GET, PUT, DELETE, **GET /lookup** *(novo 15 Abr)*)
- ✅ Presenter com métodos estáticos (toHTTP, toHTTPList)
- ✅ RBAC Guards: RolesGuard, TenantFilterGuard nos endpoints
- ✅ Paginação via PaginationOptions + PaginatedResponse
- ✅ Soft-delete com status enum (ACTIVE, INACTIVE, SUSPENDED)
- ✅ 100% alinhado com User Module architecture
- ✅ Schema Prisma com DriverStatus enum
- ✅ Compilação sem erros TypeScript ✅
- ✅ **[15 Abr]** `organizationId` removido do model Driver (migration `remove_org_from_driver` aplicada)
- ✅ **[15 Abr]** Driver agora desacoplado de Organization — vínculo via `OrganizationMembership`
- ✅ **[15 Abr]** `POST /drivers` é self-service: usuário cria próprio perfil, `userId` vem do JWT
- ✅ **[15 Abr]** `LookupDriverUseCase`: admin busca driver por email + CNH (verificação de identidade)
- ✅ **[15 Abr]** `GET /drivers/lookup` endpoint (ADMIN only) com validação de query params
- ✅ **[15 Abr]** `DriverLookupResponseDto` e `DriverProfileNotFoundByEmailError` criados
- ✅ **[15 Abr]** `findByOrganizationId` reimplementado via JOIN (`user.userRoles.some`)
- ✅ **[15 Abr]** `findByCnh()` adicionado ao `DriverRepository`
- ✅ **[15 Abr]** `DriverAlreadyExistsError` — previne criação duplicada de perfil driver (HTTP 409)
- ✅ **[15 Abr]** `DriverModule` importa `UserModule` (para `UserRepository` no LookupDriverUseCase)
- ✅ **[16 Abr]** Testes unitários do `CreateDriverUseCase` — 4 testes (happy path criação, check antes de save, DriverAlreadyExistsError, DriverCreationFailedError)
- ✅ **[17 Abr]** IDOR fix: `DriverAccessForbiddenError` adicionado (`code = 'DRIVER_ACCESS_FORBIDDEN'`)
- ✅ **[17 Abr]** `belongsToOrganization(driverId, organizationId)` adicionado na interface e no `PrismaDriverRepository` (query via `user.userRoles.some`)
- ✅ **[17 Abr]** `FindDriverByIdUseCase`, `UpdateDriverUseCase`, `RemoveDriverUseCase` agora recebem `organizationId` e verificam ownership via `belongsToOrganization`
- ✅ **[17 Abr]** Controller `GET /:id`, `PUT /:id`, `DELETE /:id` passam `context.organizationId` do JWT para os use cases

**Arquivos implementados:**
```
src/modules/driver/
├── application/dtos/ ✅ (create-driver, update-driver, driver-response, driver-lookup-response)
├── application/use-cases/ ✅ (7 use cases)
├── domain/
│   ├── entities/driver.entity.ts ✅
│   ├── errors/driver.errors.ts ✅ (11+ error types)
│   ├── value-objects/ ✅ (cnh, cnh-category)
│   └── interfaces/driver.repository.ts ✅ (inclui findByCnh)
├── infrastructure/
│   ├── db/mappers/driver.mapper.ts ✅
│   └── db/repositories/prisma-driver.repository.ts ✅
├── presentation/
│   ├── controllers/driver.controller.ts ✅
│   └── mappers/driver.presenter.ts ✅
├── driver.module.ts ✅ (importa UserModule)
└── README.md ✅
```

**Alinhamento com User Module:**
- ✅ save() retorna Promise<DriverEntity | null>
- ✅ update() retorna Promise<DriverEntity | null>
- ✅ delete() em vez de remove()
- ✅ findByOrganizationId() usa PaginationOptions
- ✅ Retorno PaginatedResponse<DriverEntity>
- ✅ Value Objects com validação de domínio
- ✅ Mapper com toDomain/toPersistence
- ✅ Presenter com métodos estáticos
- ✅ DTOs com Swagger documentation

**Refactor (13 Abr 2026):**
- Use cases reescritos com error handling mais preciso e tipagem aprimorada
- `PrismaDriverRepository` reestruturado para melhor consistência
- Novos tipos de erro adicionados ao `driver.errors.ts`
- Compilação TypeScript ✅ sem erros

**Redesign Arquitetural (15 Abr 2026):**
- `organizationId` removido do model `Driver` — drivers agora são entidades globais vinculadas a organizações via `OrganizationMembership`
- Isso resolve o problema fundamental: antes, um usuário só podia ser driver de **uma** org. Agora pode ser driver de múltiplas orgs
- `POST /drivers` virou self-service (qualquer usuário autenticado preenche CNH/categoria/expiração)
- Admin usa `GET /drivers/lookup?email=x&cnh=y` para verificar identidade antes de vincular via membership
- `findByOrganizationId` reimplementado com JOIN: `user.userRoles.some({ organizationId, role: { name: 'DRIVER' } })`
- Migration `remove_org_from_driver` aplicada com sucesso
- Verificada prevenção de duplicatas: `@@id([userId, roleId, organizationId])` na `OrganizationMembership` + check no `CreateMembershipUseCase`

**Testes (16 Abr 2026):**
```
test/modules/driver/
├── factories/driver.factory.ts ✅ (makeDriver com value objects Cnh/CnhCategory)
├── factories/create-driver.dto.factory.ts ✅ (makeCreateDriverDto)
└── application/use-cases/create-driver.use-case.spec.ts ✅ (4 testes)
```

**Status:** Funcional, redesenhado, compilando e testado. IDOR corrigido. ✅

---

### User Module ✅ COMPLETO (CRUD + Infraestrutura)
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Soft-delete (status INACTIVE)
- ⏳ Testes unitários (pendente — use cases CRUD ainda sem spec)
- ✅ Exception handling
- ✅ DTOs com validação
- ✅ Repositório pattern

**Status:** Funcional. Testes de CRUD pendentes.

---

### Organization Module ✅ CRUD COMPLETO (05 Abr 2026) | 🔄 Members Pendente

**Backend (API REST) - CRUD ✅ COMPLETO:**
- [x] POST `/organizations` - Criar org (DTO + Service + Repository) ✅
- [x] GET `/organizations` - Listar todas orgs (paginado) ✅
- [x] GET `/organizations/active` - Listar apenas ativas (paginado) ✅
- [x] GET `/organizations/me` - Listar organizações associadas ao usuário autenticado (ADMIN e DRIVER) ✅ *(21 Abr)*
- [x] GET `/organizations/:id` - Detalhes da org ✅
- [x] PUT `/organizations/:id` - Atualizar dados ✅
- [x] DELETE `/organizations/:id` - Soft-delete (marcar como INACTIVE) ✅
- [x] CRUD Use Cases (6 total) ✅
- [x] Value Objects com validações ✅
- [x] Exception Handling específico ✅
- [ ] Testes unitários (pendente — use cases CRUD sem spec)
- [ ] Swagger docs integrado (já está com @ApiTags e decorators)

**Use Cases Implementados (6 total):**
- ✅ CreateOrganizationUseCase - Validação e criação com slug auto-gerado *(refatorado 14 Abr: SRP — apenas cria org, sem deps de Membership/Role)*
- ✅ FindAllOrganizationsUseCase - Listagem paginada
- ✅ FindAllActiveOrganizationsUseCase - Listagem paginada (apenas ativas)
- ✅ FindOrganizationByIdUseCase - Busca com tratamento 404 *(atualizado 14 Abr: usa `OrganizationForbiddenError` em vez de `ForbiddenException`)*
- ✅ UpdateOrganizationUseCase - Atualização com re-validação *(atualizado 14 Abr: usa `OrganizationForbiddenError`)*
- ✅ DisableOrganizationUseCase - Soft delete com timestamp *(atualizado 14 Abr: usa `OrganizationForbiddenError`)*
- ✅ **[21 Abr]** `FindOrganizationByUserUseCase` — retorna orgs associadas ao `userId` (paginado), delega para `findOrganizationByUserId` no repositório

**Domain Errors:**
- ✅ `OrganizationNotFoundError`, `OrganizationAlreadyExistsError`
- ✅ **[14 Abr]** `OrganizationForbiddenError` (código `ORGANIZATION_ACCESS_FORBIDDEN` → HTTP 403) — substitui `ForbiddenException` do NestJS nos use-cases
- ✅ **[14 Abr]** `TenantContextParams` movido para `application/dtos/index.ts` (desacoplamento entre use-cases)

**Decoupling (14 Abr 2026):**
- ✅ `POST /organizations` agora é `@Dev()` apenas — criação real via `/auth/register-organization`
- ✅ `OrganizationModule` não importa mais `MembershipModule` (`forwardRef` removido) — zero acoplamento
- ✅ `RegisterOrganizationWithAdminUseCase` no Auth Module assume a orquestração completa (User → Org → Membership)

**Value Objects Implementados (5 total):**
- ✅ Cnpj - Validação de CNPJ com dígitos verificadores
- ✅ OrganizationName - Validação de tamanho mínimo/máximo
- ✅ Slug - Gerado automaticamente e URL-friendly
- ✅ Address - Endereço da organização
- ✅ Email, Telephone - Compartilhados do SharedModule

**Organization — Novos Endpoints (21 Abr 2026):**
- ✅ `GET /organizations/me` — lista orgs do usuário autenticado (ADMIN e DRIVER, paginado)
- ✅ `FindOrganizationByUserUseCase` criado, registrado e exportado no `OrganizationModule`

**Organization Members (multi-tenant com Roles) - GERENCIADO VIA MEMBERSHIP MODULE:**
- ✅ Integração feita via `POST /memberships` (Membership Module)
- ✅ Listagem de membros via `GET /memberships/organization/:organizationId`
- ✅ Consulta de role do usuário na org via `GET /memberships/me/role/:organizationId` *(21 Abr)*
- ✅ Guards RBAC já implementados (RolesGuard, TenantFilterGuard)
- ✅ Gestão de membros é responsabilidade do Membership Module (arquitetura SRP)

**Arquivos criados:**
```
src/modules/organization/
├── application/dtos/
│   ├── create-organization.dto.ts ✅
│   ├── update-organization.dto.ts ✅
│   └── organization-response.dto.ts ✅
├── domain/
│   ├── entities/
│   │   ├── index.ts ✅
│   │   └── organization.entity.ts ✅
│   ├── errors/
│   │   ├── index.ts ✅
│   │   └── organization.errors.ts ✅
│   ├── value-objects/
│   │   ├── address.value-object.ts ✅
│   │   ├── cnpj.value-object.ts ✅
│   │   ├── index.ts ✅
│   │   ├── organization-name.value-object.ts ✅
│   │   └── slug.value-object.ts ✅
│   └── interfaces/
│       └── organization.repository.ts ✅
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── organization.mapper.ts ✅
│       └── repositories/
│           └── prisma-organization.repository.ts ✅
├── presentation/
│   ├── controllers/
│   │   └── organization.controller.ts ✅
│   └── mappers/
│       └── organization.mapper.ts ✅
└── organization.module.ts ✅
```

**Status CRUD:** ✅ FUNCIONAL E COMPLETO (05 Abr 2026)

**Estimativa (Members + RBAC):** 2-3 dias

---

## ⏳ FASE 2: Core Features (Abr-Mai 2026)

### Authentication & JWT ✅ COMPLETO (14 Abr 2026) | 🔄 Hardening (15 Abr 2026)

**Backend (API REST):**
- [x] POST `/auth/login` - Login com email/password
- [x] POST `/auth/register` - Registrar novo user
- [x] POST `/auth/refresh` - Refresh token
- [x] POST `/auth/register-organization` - Registro de organização + admin em uma chamada ✅ (12 Abr)
- [x] POST `/auth/setup-organization` - Usuário já autenticado cria org e recebe novo JWT ✅ (14 Abr)
- [x] JWT Strategy + Passport
- [x] JWT Strategy otimizado - sem query ao banco em cada request ✅ (13 Abr)
- [x] JwtAuthGuard para proteger rotas
- [x] `RefreshTokenDto` com class-validator ✅ (15 Abr)
- [x] `@Global()` removido do AuthModule ✅ (15 Abr)
- [x] Rate limiting global (`@nestjs/throttler`, 60 req/min) ✅ (15 Abr)
- [x] Swagger docs ✅ (05 Abr 2026)
- [x] Testes unitários — 3 use cases testados (16 testes) ✅ (16 Abr)
- [ ] Testes unitários — RegisterUseCase e RefreshTokenUseCase (pendentes)
- [ ] Logout (invalidação de tokens)

**Use Cases Implementados:**
1. `LoginUseCase` - Valida credenciais, gera tokens JWT — ✅ **5 testes** *(16 Abr)*
2. `RegisterUseCase` - Cria usuário com validação e hash de senha
3. `RefreshTokenUseCase` - Valida refresh token e gera novo par
4. `RegisterOrganizationWithAdminUseCase` - Orquestra User → Org → Membership **atomicamente via `TransactionManager.runInTransaction`** — rollback pelo Prisma se qualquer etapa falhar *(padrão de compensação manual removido 27 Abr)* — ✅ **5 testes** *(16 Abr)*
5. `SetupOrganizationForExistingUserUseCase` - Usuário já logado cria org, obtém membership ADMIN e recebe JWT atualizado *(novo 14 Abr)* — ✅ **6 testes** *(16 Abr)*

**Novo Use Case - SetupOrganizationForExistingUserUseCase (14 Abr 2026):**
- Para usuários já autenticados que ainda não possuem organização
- Valida usuário existe e está ACTIVE
- Cria org → cria membership ADMIN → re-emite JWT com novo contexto de org
- Frontend recebe token atualizado na mesma chamada (sem precisar re-logar)
- `SetupOrganizationDto`: `{ organizationName, cnpj, organizationEmail, organizationTelephone, address, slug }`

**Novo Use Case - RegisterOrganizationWithAdminUseCase (12 Abr 2026, atualizado 14 Abr):**
- Orquestra criação de usuário + organização + login automático em um único fluxo
- `RegisterOrganizationWithAdminDto`: DTO unificado (dados do admin + dados da org)
- Compensação em 2 estágios: ~~`compensateUser()` chamado se org ou membership falhar~~ **substituído por `TransactionManager.runInTransaction` (27 Abr) — rollback automático pelo Prisma**
- `CreateOrganizationUseCase` simplificado para SRP (apenas cria org) — membership agora é responsabilidade do orquestrador

**Otimização JWT Strategy (13 Abr 2026):**
- Removida query ao banco (`userRepository.findById`) a cada requisição autenticada
- Strategy agora confia no payload do JWT (enriquecido em login/refresh)
- Melhoria de performance em rotas autenticadas

**Arquivos criados/modificados:**
```
src/modules/auth/
├── auth.module.ts ✅ (atualizado - @Global removido 15 Abr)
├── application/dtos/
│   ├── login.dto.ts ✅
│   ├── register.dto.ts ✅
│   ├── token-response.dto.ts ✅
│   ├── refresh-token.dto.ts ✅ (novo - 15 Abr)
│   ├── register-organization.dto.ts ✅ (novo - 12 Abr)
│   └── setup-organization.dto.ts ✅ (novo - 14 Abr)
├── application/use-cases/
│   ├── login.use-case.ts ✅
│   ├── register.use-case.ts ✅
│   ├── refresh-token.use-case.ts ✅
│   ├── register-organization-with-admin.use-case.ts ✅ (atualizado - 14 Abr)
│   └── setup-organization-for-existing-user.use-case.ts ✅ (novo - 14 Abr)
├── infrastructure/
│   └── jwt.strategy.ts ✅ (refatorado - sem DB query - 13 Abr)
├── presentation/controllers/
│   └── auth.controller.ts ✅ (atualizado - RefreshTokenDto 15 Abr)
└── README.md ✅

src/shared/guards/
└── jwt.guard.ts ✅
```

**Testes Unitários (16 Abr 2026):**
```
test/modules/auth/
├── factories/
│   ├── jwt-payload.factory.ts ✅ (makeJwtPayload)
│   ├── register-org.dto.factory.ts ✅ (makeRegisterOrgDto)
│   └── setup-org.dto.factory.ts ✅ (makeSetupOrgDto)
└── application/use-cases/
    ├── login.use-case.spec.ts ✅ (5 testes)
    ├── register-organization-with-admin.use-case.spec.ts ✅ (5 testes)
    └── setup-organization.use-case.spec.ts ✅ (6 testes)

test/modules/user/factories/
└── user.factory.ts ✅ (makeUser)

test/modules/organization/factories/
└── organization.factory.ts ✅ (makeOrganization)

test/shared/factories/
└── role.factory.ts ✅ (makeRole)
```

**Padrão de Testes Adotado:**
- AAA (Arrange-Act-Assert) com `makeMocks()` + `setupHappyPath()` + `sut`
- Factories por módulo para criação de entidades de teste
- Injeção manual de dependências (sem mocks de framework)
- Config dedicada: `test/jest-unit.json` (rootDir, moduleNameMapper para aliases `src/`)

**Status:** ✅ COMPLETO, hardened e testado (16 Abr 2026)

---

### RBAC Guards & Authorization ✅ COMPLETO (11 Abr 2026)

**O Problema Identificado:**
O middleware `TenantContextMiddleware` rodava ANTES do `JwtAuthGuard` no pipeline do NestJS, portanto `req.user` ainda não existia e o contexto não era populado. Guards que dependiam de `req.context` falhavam com erro 400.

**Solução Implementada:**
Integração da população de `req.context` diretamente no `JwtAuthGuard`, garantindo que esteja disponível para todos os guards subsequentes.

**Pipeline NestJS Corrigido:**
```
Request → JwtAuthGuard (valida JWT, popula req.user e req.context)
        → RolesGuard / TenantFilterGuard / DevGuard (leem req.context)
        → Controller
```

**Componentes Implementados:**
- ✅ `@Dev()` decorator - Marca rotas como exclusivas para devs
- ✅ `DevGuard` - Bloqueia acesso de não-devs em rotas `@Dev()`
- ✅ `TenantContext` interface - Centralizada em `types/tenant-context.interface.ts` (fonte única de verdade)
- ✅ `JwtAuthGuard` refatorado - Popula `req.context` após validação do JWT
- ✅ `RolesGuard` refatorado - Import atualizado, bypass implícito para devs
- ✅ `TenantFilterGuard` refatorado - Import atualizado
- ✅ Removido `TenantContextMiddleware` do `AppModule` (não era capaz de funcionar no pipeline)
- ✅ Removido `TenantContextInterceptor` do `SharedModule` (substituído por lógica no `JwtAuthGuard`)
- ✅ User Controller - Aplicado `@Dev()` em rotas de acesso global
- ✅ Organization Controller - Aplicado `@Dev()` em rotas de acesso global (12 Abr)

**Três Responsabilidades Distintas:**
1. **TenantFilterGuard**: "Você pertence a essa organização?" (isolamento multi-tenant)
2. **RolesGuard**: "Você tem permissão para fazer isso dentro da sua org?" (autorização por role)
3. **DevGuard**: "Você é desenvolvedor?" (acesso a endpoints internos/debug)

**Arquivos Criados/Modificados:**
```
src/shared/
├── infrastructure/
│   ├── decorators/
│   │   ├── dev.decorator.ts ✅ (novo)
│   │   └── get-user.decorator.ts ✅ (novo - 12 Abr)
│   ├── guards/
│   │   ├── jwt.guard.ts ✅ (refatorado - agora popula req.context)
│   │   ├── roles.guard.ts ✅ (import atualizado)
│   │   ├── tenant-filter.guard.ts ✅ (import atualizado)
│   │   └── dev.guard.ts ✅ (novo)
│   └── types/
│       └── tenant-context.interface.ts ✅ (novo - interface centralizada)
└── presentation/
    ├── interceptors/
    │   └── tenant-context.interceptor.ts ✅ (marcado @deprecated)
    └── exceptions/
        └── all-exceptions.filter.ts ✅ (refatorado - mapeamento por padrão de código - 13 Abr)

src/modules/user/presentation/controllers/
└── user.controller.ts ✅ (aplicado @Dev() em rotas de acesso global)

src/modules/organization/presentation/controllers/
└── organization.controller.ts ✅ (aplicado @Dev() em rotas de acesso global - 12 Abr)
```

**Compilação:** ✅ TypeScript sem erros (13 Abr 2026)
**Validação:** ✅ Testado em produção - req.context populando corretamente

**Status:** ✅ FUNCIONAL E OPERACIONAL

---

### Vehicles Module ✅ COMPLETO (17 Abr 2026)

**CRUD de Veículos — Implementação Completa:**
- ✅ Entity `VehicleEntity` com `VehicleProps`, `create()`, `restore()`, getters, `activate()`, `deactivate()`, `isActive()`, `updatePlate()`, `updateMaxCapacity()`, `updateModel()`, `updateType()`
- ✅ Value Object `Plate` — validação de placa brasileira (formato antigo `ABC1234` + Mercosul `ABC1D23`), `create()`, `restore()`, `equals()`, `toString()`
- ✅ Enums: `VehicleType { VAN, BUS, MINIBUS, CAR }`, `VehicleStatus { ACTIVE, INACTIVE }`
- ✅ Domain Errors: `InvalidPlateError`, `PlateAlreadyInUseError`, `VehicleNotFoundError`, `VehicleAccessForbiddenError`, `VehicleInactiveError`, `InvalidMaxCapacityError`, `VehicleCreationFailedError`, `VehicleUpdateFailedError` (8 tipos)
- ✅ Repository interface: `save`, `findById`, `findByPlate`, `findByOrganizationId`, `update`, `delete`
- ✅ `PrismaVehicleRepository` implementação completa
- ✅ `VehicleMapper` com `toDomain()` (hidrata `Plate.restore`, casts de enum) e `toPersistence()`
- ✅ DTOs: `CreateVehicleDto`, `UpdateVehicleDto`, `VehicleResponseDto` com class-validator + Swagger
- ✅ Use Cases (5 total): `CreateVehicle`, `FindVehicleById`, `FindAllVehiclesByOrganization`, `UpdateVehicle`, `RemoveVehicle`
- ✅ `VehiclePresenter` com `toHTTP()` e `toHTTPList()`
- ✅ `VehicleController` com 5 endpoints REST, `JwtAuthGuard`, `RolesGuard`, `TenantFilterGuard`, `@Roles(ADMIN)`
- ✅ `VehicleModule` wired no `AppModule`
- ✅ **IDOR fix**: `FindVehicleByIdUseCase`, `UpdateVehicleUseCase`, `RemoveVehicleUseCase` verificam `vehicle.organizationId !== organizationId` e lançam `VehicleAccessForbiddenError`
- ✅ **Proteção de inativo**: `UpdateVehicleUseCase` rejeita atualização se `status === INACTIVE` (`VehicleInactiveError`)
- ✅ README.md criado com documentação completa

**Endpoints REST:**
- `POST /vehicles/organization/:organizationId` — Registrar novo veículo
- `GET /vehicles/organization/:organizationId` — Listar veículos da organização (paginado)
- `GET /vehicles/:id` — Buscar veículo por ID
- `PUT /vehicles/:id` — Atualizar veículo
- `DELETE /vehicles/:id` — Desativar veículo (soft delete)

**Regras de Negócio:**
- Placa única no sistema (`PlateAlreadyInUseError`)
- `maxCapacity` deve ser inteiro positivo (`InvalidMaxCapacityError`)
- Soft delete via `status = INACTIVE` (registro não é excluído)
- Veículos inativos não podem ser atualizados (`VehicleInactiveError`)
- Isolamento de tenant: operações por ID verificam `organizationId` do JWT (`VehicleAccessForbiddenError`)

**Arquivos implementados:**
```
src/modules/vehicle/
├── vehicle.module.ts ✅
├── application/
│   ├── dtos/ ✅ (create-vehicle, update-vehicle, vehicle-response, index)
│   └── use-cases/ ✅ (5 use cases + index)
├── domain/
│   ├── entities/vehicle.entity.ts ✅
│   ├── entities/errors/vehicle.errors.ts ✅ (8 error types)
│   ├── entities/value-objects/plate.value-object.ts ✅
│   └── interfaces/vehicle.repository.ts ✅ (+ enums)
├── infrastructure/
│   ├── db/mappers/vehicle.mapper.ts ✅
│   └── db/repositories/prisma-vehicle.repository.ts ✅
├── presentation/
│   ├── controllers/vehicle.controller.ts ✅
│   └── mappers/vehicle.presenter.ts ✅
└── README.md ✅
```

**Status:** ✅ COMPLETO — CRUD funcional, IDOR protegido, soft delete seguro (17 Abr 2026)

---

### Drivers Module — ✅ JÁ IMPLEMENTADO (ver Driver Module acima)

> O módulo Driver foi implementado na Fase 1 (11 Abr) e redesenhado (15 Abr).
> IDOR corrigido em 17 Abr com `DriverAccessForbiddenError` + `belongsToOrganization()`.

---

### Trips Module ✅ COMPLETO (21 Abr 2026)

**TripTemplate — Gerenciamento de Templates de Viagem:**
- ✅ Entity `TripTemplate` com campos: `departurePoint`, `destination`, `frequency` (DayOfWeek[]), `stops`, preços (`priceOneWay`, `priceReturn`, `priceRoundTrip`), `isPublic`, `isRecurring`, `autoCancelEnabled`, `minRevenue`, `autoCancelOffset`, `status`, `shift`
- ✅ Domain Errors: `TripTemplateNotFoundError`, `TripTemplateAccessForbiddenError`, `TripTemplateInactiveError`
- ✅ Repository interface + `PrismaTripTemplateRepository` + `TripTemplateMapper`
- ✅ Use Cases (5): `CreateTripTemplate`, `FindTripTemplateById`, `FindAllTripTemplatesByOrganization`, `UpdateTripTemplate`, `DeactivateTripTemplate`
- ✅ DTOs com class-validator + Swagger, Presenter, Controller

**TripInstance — Instâncias de Viagem:**
- ✅ Entity `TripInstance` com `driverId?`, `vehicleId?`, `tripTemplateId`, `organizationId`, `tripStatus` (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), `totalCapacity`, `departureTime`, `arrivalEstimate`, `autoCancelAt?`, `forceConfirm`, `minRevenue?`
- ✅ Métodos de domínio: `assignDriver(driverId | null)`, `assignVehicle(vehicleId | null)`, `transitionStatus(newStatus)`, `forceConfirmTrip()`
- ✅ Domain Errors: `TripInstanceNotFoundError`, `TripInstanceAccessForbiddenError`, `InvalidTripStatusTransitionError`
- ✅ Repository interface + `PrismaTripInstanceRepository` + `TripInstanceMapper`
- ✅ Use Cases (7): `CreateTripInstance`, `FindTripInstanceById`, `FindAllTripInstancesByOrganization`, `FindTripInstancesByTemplate`, `TransitionTripInstanceStatus`, `AssignDriverToTripInstance`, `AssignVehicleToTripInstance`
- ✅ DTOs com class-validator + Swagger, Presenter, Controller

**Endpoints REST:**
- `POST /trip-templates` — Criar template
- `GET /trip-templates/organization/:organizationId` — Listar templates da org (paginado)
- `GET /trip-templates/:id` — Buscar template por ID
- `PUT /trip-templates/:id` — Atualizar template
- `DELETE /trip-templates/:id` — Desativar template (soft)
- `POST /trip-instances` — Criar instância a partir de template
- `GET /trip-instances/organization/:organizationId` — Listar instâncias da org (paginado)
- `GET /trip-instances/template/:templateId` — Listar instâncias de um template (paginado)
- `GET /trip-instances/:id` — Buscar instância por ID
- `PUT /trip-instances/:id/status` — Transitar status da viagem
- `PUT /trip-instances/:id/driver` — Atribuir/desatribuir motorista
- `PUT /trip-instances/:id/vehicle` — Atribuir/desatribuir veículo

**Segurança e Validações (21 Abr 2026):**
- ✅ FK violation corrigido em `AssignDriverToTripInstanceUseCase`: valida existência do driver via `DriverRepository.findById()` antes de persistir — lança `DriverNotFoundError` (HTTP 400) em vez de 500
- ✅ FK violation corrigido em `AssignVehicleToTripInstanceUseCase`: valida existência do veículo via `VehicleRepository.findById()` antes de persistir — lança `VehicleNotFoundError` (HTTP 400) em vez de 500
- ✅ `TripModule` importa `DriverModule` e `VehicleModule` para DI dos repositórios de validação
- ✅ `VehicleModule` exporta `VehicleRepository` (estava faltando)

**Arquivos implementados:**
```
src/modules/trip/
├── trip.module.ts ✅ (importa DriverModule + VehicleModule — 21 Abr)
├── application/use-cases/ ✅ (7 use cases)
├── domain/entities/ ✅ (TripTemplate, TripInstance)
├── domain/entities/errors/ ✅
├── domain/interfaces/ ✅ (TripTemplateRepository, TripInstanceRepository)
├── infrastructure/db/mappers/ ✅
├── infrastructure/db/repositories/ ✅
└── presentation/controllers/ ✅ (TripTemplateController, TripInstanceController)
```

**Status:** ✅ COMPLETO — CRUD funcional, FK violations corrigidas, isolamento de tenant aplicado (21 Abr 2026)

---

### Bookings Module ✅ COMPLETO (25 Abr 2026) | 🔄 Melhorias (25 Abr 2026)

**Endpoints REST (9 rotas):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `POST` | `/bookings` | JWT | Cria inscrição (price server-side, capacity check) |
| `GET` | `/bookings/user?status=ACTIVE\|INACTIVE` | JWT | Bookings do usuário (filtro por status) |
| `GET` | `/bookings/availability/:tripInstanceId` | JWT | Verifica vagas disponíveis antes de criar |
| `GET` | `/bookings/trip-instance/:id` | JWT + ORG | Lista passageiros (só org members) |
| `GET` | `/bookings/organization/:id` | JWT + ADMIN | Lista inscrições da org (paginado) |
| `GET` | `/bookings/:id` | JWT | Detalhe básico (owner ou org member) |
| `GET` | `/bookings/:id/details` | JWT | Detalhe enriquecido com dados da viagem (owner ou org) |
| `PATCH` | `/bookings/:id/cancel` | JWT | Cancela (bloqueia IN_PROGRESS/FINISHED) |
| `PATCH` | `/bookings/:id/confirm-presence` | JWT + ORG | Confirma presença (só org members) |

**Regras de Negócio Implementadas:**
- ✅ Inscrição apenas em viagens `SCHEDULED` ou `CONFIRMED` (`TripInstanceNotBookableError`)
- ✅ Prevenção de inscrição duplicada ativa (mesmo user, mesma instância) → `BookingAlreadyExistsError`
- ✅ Reinscrição após cancelamento permitida (histórico múltiplo `INACTIVE`; banco garante no máximo 1 `ACTIVE` por `(userId, tripInstanceId)` via `activeKey`)
- ✅ Controle de acesso: `hasOrgAccess || isOwner` — org members OU dono do booking
- ✅ `userId` **nunca** vem do body — exclusivamente do JWT. `organizationId` derivado da instância (create) ou do JWT (cancel/confirm/findById)
- ✅ Soft-delete via `booking.cancel()` (status → INACTIVE)
- ✅ Confirmação de presença via `booking.confirmPresence()` (presenceConfirmed → true) — **apenas org members** (owner bloqueado)
- ✅ Preço gravado server-side a partir do `TripTemplate` (`priceOneWay / priceReturn / priceRoundTrip`) — client não envia preço
- ✅ Controle de capacidade: `countActiveByTripInstance` verifica vagas antes de criar → `TripInstanceFullError`
- ✅ `FindBookingsByTripInstanceUseCase`: só org members podem listar passageiros (`BookingAccessForbiddenError` para B2C)
- ✅ `FindBookingsByUserUseCase`: aceita `status?: Status` para filtrar por ACTIVE/INACTIVE
- ✅ `GetBookingAvailabilityUseCase`: qualquer JWT autenticado pode verificar disponibilidade antes de criar
- ✅ `FindBookingDetailsUseCase`: retorna dados enriquecidos com trip instance (horário, status, vagas)

**Domain Layer:**
- ✅ `Booking` entity com `create()` e `restore()`, métodos `cancel()` e `confirmPresence()`, `validateStops()`
- ✅ `EnrollmentType` enum: `ONE_WAY | RETURN | ROUND_TRIP`
- ✅ `Money` value object para `recordedPrice` (preço gravado no momento da inscrição)
- ✅ 9 domain errors: `BookingNotFoundError`, `BookingAccessForbiddenError`, `BookingAlreadyExistsError`, `InvalidBookingStopError`, `BookingCreationFailedError`, `TripInstanceNotBookableError`, `TripInstanceFullError`, `BookingCancellationNotAllowedError`, `TripPriceNotAvailableError`
- ✅ `BookingRepository` (abstract class): `save`, `update`, `delete`, `findById`, `findAll`, `findByOrganizationId`, `findByUserId(userId, options, status?)`, `findByTripInstanceId`, `findByUserAndTripInstance`, `countActiveByTripInstance`

**Infrastructure Layer:**
- ✅ `PrismaBookingRepository` com todos os métodos implementados
- ✅ `$transaction([findMany, count])` para queries paginadas
- ✅ `findByUserAndTripInstance` filtra `status: ACTIVE`; unicidade de inscrição ativa garantida por `activeKey` (permite múltiplas `INACTIVE`)
- ✅ `findByUserId` aceita `status?` opcional — `where = status ? { userId, status } : { userId }`
- ✅ `countActiveByTripInstance` conta apenas `status: ACTIVE`
- ✅ `BookingMapper` com `toDomain()` (hidrata `Money.restore()`, cast `EnrollmentType`) e `toPersistence()`

**Application Layer:**
- ✅ 9 use cases: `CreateBookingUseCase`, `CancelBookingUseCase`, `ConfirmPresenceUseCase`, `FindBookingByIdUseCase`, `FindBookingsByOrganizationUseCase`, `FindBookingsByTripInstanceUseCase`, `FindBookingsByUserUseCase`, `FindBookingDetailsUseCase`, `GetBookingAvailabilityUseCase`
- ✅ `CreateBookingUseCase`: **todo o fluxo** (countActive + save + payment.save) dentro de `runInTransaction(Serializable)` — race condition de capacidade resolvida; verifica trip → capacity → duplicate → price server-side → `Booking.create()` → save
- ✅ `CancelBookingUseCase`: bloqueia trip `IN_PROGRESS` ou `FINISHED`; bloqueia booking já `INACTIVE` (`BookingAlreadyInactiveError`); bloqueia cancelamento dentro de 30 min da partida (`BookingCancellationDeadlineError`)
- ✅ `ConfirmPresenceUseCase`: **apenas org members** — owner é bloqueado (`BookingAccessForbiddenError`); bloqueia booking `INACTIVE` (`BookingAlreadyInactiveError`)
- ✅ `FindBookingsByTripInstanceUseCase`: 3º param `callerOrganizationId?` — bloqueia acesso B2C
- ✅ `FindBookingsByUserUseCase`: 3º param `status?: Status` repassado ao repositório
- ✅ `FindBookingDetailsUseCase`: injeta `BookingRepository` + `TripInstanceRepository`; retorna `BookingDetailsResponseDto`
- ✅ `GetBookingAvailabilityUseCase`: injeta `TripInstanceRepository` + `BookingRepository`; retorna `BookingAvailabilityResponseDto`
- ✅ DTOs novos: `BookingDetailsResponseDto` (extends `BookingResponseDto` + dados da trip), `BookingAvailabilityResponseDto` (`tripInstanceId`, `tripStatus`, `totalCapacity`, `activeCount`, `availableSlots`, `isBookable`)

**Testes Unitários:**
- ✅ 9 suites, **85 testes** — todos passando (total acumulado do projeto: **34 suites, 252 testes** — 27 Abr; **37 suites, 278 testes** — 28 Abr)
- ✅ `create-booking.use-case.spec.ts` — atualizado (27 Abr): 18 testes (era 12 — adicionados testes de PaymentCreationFailedError + TransactionManager)

**⚠️ Bugs identificados (pendentes de fix):**
- ❌ `FindBookingsByOrganizationUseCase` e `FindBookingsByTripInstanceUseCase`: sem filtro por status na listagem

**Arquivos:**
```
src/modules/bookings/
├── application/
│   ├── dtos/ (create-booking, booking-response, booking-details-response, booking-availability-response, index)
│   └── use-cases/ (9 use cases + index.ts)
├── domain/
│   ├── entities/booking.entity.ts
│   ├── entities/errors/booking.errors.ts
│   └── interfaces/ (booking.repository.ts, enums/, index.ts)
├── infrastructure/db/
│   ├── mappers/booking.mapper.ts
│   └── repositories/prisma-booking.repository.ts
├── presentation/
│   ├── controllers/booking.controller.ts  (9 rotas; JwtAuthGuard global; RolesGuard em /organization)
│   └── mappers/booking.presenter.ts
└── bookings.module.ts  (imports: PrismaModule, SharedModule, TripModule)

test/modules/bookings/
├── factories/ (booking.factory.ts, create-booking.dto.factory.ts)
└── application/use-cases/ (9 specs)
```

**Status:** ✅ COMPLETO — 9 use cases, 9 rotas REST, 85 testes, TypeScript zero erros (25 Abr 2026)

---

## 💰 FASE 3: Monetização ✅ COMPLETO (26 Abr 2026)

### Plans Module ✅ COMPLETO (26 Abr 2026)

**Endpoints REST (5 rotas):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `POST` | `/plans` | JWT + @Dev() | Cria plano (apenas devs) |
| `PATCH` | `/plans/:id` | JWT + @Dev() | Atualiza dados do plano |
| `PATCH` | `/plans/:id/deactivate` | JWT + @Dev() | Desativa plano |
| `GET` | `/plans` | JWT | Lista todos os planos disponíveis |
| `GET` | `/plans/:id` | JWT | Busca plano por ID |

**Domain Layer:**
- ✅ `PlanEntity` com `create()`, `restore()`, `update()`, `deactivate()` — campo `name` imutável
- ✅ `PlanName` enum: `FREE | BASIC | PRO | PREMIUM`
- ✅ `Money` value object para `price`
- ✅ `id = 0` na criação (banco gera o ID real)
- ✅ 3 domain errors: `PlanNotFoundError` (404, `PLAN_NOT_FOUND`), `PlanAlreadyExistsError` (409, `PLAN_ALREADY_EXISTS`), `PlanCreationFailedError` (400, `PLAN_CREATION_FAILED_BAD_REQUEST`)

**Application Layer:**
- ✅ 5 use cases: `CreatePlanUseCase`, `UpdatePlanUseCase`, `DeactivatePlanUseCase`, `FindPlanByIdUseCase`, `FindAllPlansUseCase`
- ✅ DTOs: `CreatePlanDto`, `UpdatePlanDto`, `PlanResponseDto` com class-validator + Swagger

**Infrastructure & Presentation:**
- ✅ `PrismaPlansRepository` + `PlanMapper` com `toDomain`/`toPersistence`
- ✅ `PlanPresenter` com `toHTTP()` e `toHTTPList()`
- ✅ `PlansModule` exporta `PlanRepository` — injetável em `SubscriptionsModule`

**Arquivos implementados:**
```
src/modules/plans/
├── plans.module.ts ✅
├── application/
│   ├── dtos/ ✅ (create-plan, update-plan, plan-response)
│   └── use-cases/ ✅ (5 use cases)
├── domain/
│   ├── entities/plan.entity.ts ✅
│   ├── errors/plan.errors.ts ✅ (3 erros)
│   └── interfaces/plan.repository.ts ✅
├── infrastructure/
│   ├── db/mappers/plan.mapper.ts ✅
│   └── db/repositories/prisma-plans.repository.ts ✅
├── presentation/
│   ├── controllers/plan.controller.ts ✅
│   └── mappers/plan.presenter.ts ✅
└── README.md ✅
```

**Status:** ✅ COMPLETO — CRUD funcional, writes protegidos por DevGuard + @Dev(), JSDoc em inglês (26 Abr 2026)

---

### Payment Module ✅ COMPLETO (26 Abr 2026)

**Endpoints REST (2 rotas — leitura):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `GET` | `/organizations/:organizationId/payments/:id` | JWT + ADMIN + TenantFilter | Busca pagamento por ID |
| `GET` | `/organizations/:organizationId/payments` | JWT + ADMIN + TenantFilter | Lista pagamentos da organização (paginado) |

> Criação de pagamentos é responsabilidade do `CreateBookingUseCase` no módulo Bookings.

**Domain Layer:**
- ✅ `PaymentEntity` com UUID gerado via `crypto.randomUUID()` no domínio, status inicial sempre `PENDING`
- ✅ `Money` value object para `amount`
- ✅ `MethodPayment` enum: `MONEY | PIX | CREDIT_CARD | DEBIT_CARD`
- ✅ `PaymentStatus` enum: `PENDING | COMPLETED | FAILED`
- ✅ 2 domain errors: `PaymentNotFoundError` (404, `PAYMENT_NOT_FOUND`), `PaymentCreationFailedError` (400, `PAYMENT_CREATION_FAILED_BAD_REQUEST`)

**Application Layer:**
- ✅ 2 use cases (leitura): `FindPaymentByIdUseCase`, `FindPaymentsByOrganizationUseCase`
- ✅ DTO: `PaymentResponseDto` com Swagger

**Infrastructure & Presentation:**
- ✅ `PrismaPaymentRepository` + `PaymentMapper`
- ✅ `PaymentPresenter` com `toHTTP()` e `toHTTPList()`
- ✅ `PaymentModule` exporta `PaymentRepository` — injetável em `BookingsModule`

**Arquivos implementados:**
```
src/modules/payment/
├── payment.module.ts ✅
├── application/
│   ├── dtos/ ✅ (payment-response)
│   └── use-cases/ ✅ (2 use cases)
├── domain/
│   ├── entities/payment.entity.ts ✅
│   ├── errors/payment.errors.ts ✅ (2 erros)
│   └── interfaces/payment.repository.ts ✅
├── infrastructure/
│   ├── db/mappers/payment.mapper.ts ✅
│   └── db/repositories/prisma-payment.repository.ts ✅
├── presentation/
│   ├── controllers/payment.controller.ts ✅
│   └── mappers/payment.presenter.ts ✅
└── README.md ✅
```

**Status:** ✅ COMPLETO — read-only API, criação gerenciada pelo BookingsModule, PaymentRepository exportado (26 Abr 2026)

---

### Subscriptions Module ✅ COMPLETO (26 Abr 2026)

**Endpoints REST (4 rotas):**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `POST` | `/organizations/:organizationId/subscriptions` | JWT + ADMIN + TenantFilter | Inscreve organização em um plano |
| `PATCH` | `/organizations/:organizationId/subscriptions/:id/cancel` | JWT + ADMIN + TenantFilter | Cancela assinatura ativa |
| `GET` | `/organizations/:organizationId/subscriptions/active` | JWT + ADMIN + TenantFilter | Busca assinatura ativa da org |
| `GET` | `/organizations/:organizationId/subscriptions` | JWT + ADMIN + TenantFilter | Lista histórico de assinaturas (paginado) |

**Regras de Negócio:**
- ✅ Duração configurável por plano via `plan.durationDays` (27 Abr) — constante hardcoded removida
- ✅ Plano deve existir e estar ativo para aceitar nova assinatura
- ✅ Status: `ACTIVE | CANCELED` — `cancel()` transition via método de domínio
- ✅ Isolamento de tenant via `TenantFilterGuard` + `@Roles(ADMIN)`

**Domain Layer:**
- ✅ `SubscriptionEntity` com UUID de `crypto.randomUUID()` no domínio, status inicial sempre `ACTIVE`, método `cancel()`
- ✅ `SubscriptionStatus` enum: `ACTIVE | CANCELED`
- ✅ 4 domain errors: `SubscriptionNotFoundError` (404), `SubscriptionAlreadyActiveError` (409, `SUBSCRIPTION_ALREADY_EXISTS`), `SubscriptionCreationFailedError` (400), `SubscriptionForbiddenError` (403, `SUBSCRIPTION_ACCESS_FORBIDDEN`)

**Application Layer:**
- ✅ 4 use cases: `SubscribeToPlanUseCase`, `CancelSubscriptionUseCase`, `FindActiveSubscriptionUseCase`, `FindSubscriptionsByOrganizationUseCase`
- ✅ DTOs: `CreateSubscriptionDto`, `SubscriptionResponseDto` com Swagger

**Infrastructure & Presentation:**
- ✅ `PrismaSubscriptionRepository` + `SubscriptionMapper`
- ✅ `SubscriptionPresenter` com `toHTTP()` e `toHTTPList()`
- ✅ `SubscriptionsModule` importa `PlansModule` (para `PlanRepository` no `SubscribeToPlanUseCase`)

**Arquivos implementados:**
```
src/modules/subscriptions/
├── subscriptions.module.ts ✅ (importa PlansModule)
├── application/
│   ├── dtos/ ✅ (create-subscription, subscription-response)
│   └── use-cases/ ✅ (4 use cases)
├── domain/
│   ├── entities/subscription.entity.ts ✅
│   ├── errors/subscription.errors.ts ✅ (4 erros)
│   └── interfaces/subscription.repository.ts ✅
├── infrastructure/
│   ├── db/mappers/subscription.mapper.ts ✅
│   └── db/repositories/prisma-subscription.repository.ts ✅
├── presentation/
│   ├── controllers/subscription.controller.ts ✅
│   └── mappers/subscription.presenter.ts ✅
└── README.md ✅
```

**Status:** ✅ COMPLETO — 4 use cases, isolamento de tenant ADMIN-only, dependência em PlansModule, JSDoc em inglês (26 Abr 2026)

---

## 🔧 FASE 3.5: Refatorações Arquiteturais (27 Abr 2026)

### durationDays no Plan ✅ COMPLETO (27 Abr 2026)
- ✅ Migration `20260427182603_add_plan_duration_days`: campo `durationDays Int @default(30)` no model `Plan`
- ✅ `PlanEntity`: getter `durationDays` + `create()`/`restore()`/`update()` atualizados
- ✅ `PlanMapper`: `toDomain()` e `toPersistence()` mapeiam o campo
- ✅ `CreatePlanDto` / `PlanResponseDto`: campo `durationDays` com `@IsInt() @IsPositive()`
- ✅ `PlanPresenter.toHTTP()`: inclui `durationDays`
- ✅ `SubscribeToPlanUseCase`: constante `SUBSCRIPTION_DURATION_DAYS = 30` removida → usa `plan.durationDays`
- ✅ `prisma generate` executado, client regenerado

### Infra de Transações Unificada (UnitOfWork + DbContext) ✅ COMPLETO (27 Abr 2026)

**Objetivo:** transações atômicas sem “vazamento” de Prisma na camada de aplicação, com um único padrão para o projeto.

**O que foi unificado:**
- ✅ Use cases controlam a transação via `UnitOfWork.execute(fn)` *(ou `TransactionManager.runInTransaction(fn)` como compat)*
- ✅ Remoção completa do `TransactionContext` (legado)
- ✅ Repositórios agora recebem `DbContext` e usam `dbContext.client` (cliente raiz fora de transação, cliente de tx dentro)
- ✅ `UnitOfWork` abre transações com `Serializable` e faz retry em conflitos transacionais (Prisma `P2034`)

**Motivação (arquitetura):**
- Evitar `prisma.$transaction(...)` diretamente no use case
- Garantir que múltiplos repositórios participem da mesma transação (ex: Booking + Payment)

**Como funciona (resumo):**
- `UnitOfWork` abre `prisma.$transaction(...)`
- O `tx` é armazenado no `DbContext` via `AsyncLocalStorage`
- Dentro do callback, `dbContext.client` devolve `tx` e os repositórios usam o mesmo cliente automaticamente

**Arquivos/componentes principais:**
```
src/shared/infrastructure/database/
├── db-context.ts          ✔ AsyncLocalStorage<PrismaTxClient>
├── prisma-unit-of-work.ts ✔ prisma.$transaction + dbContext.run(tx, fn)
├── transaction-manager.ts ✔ token legado (compat)
└── prisma.module.ts       ✔ exports: PrismaService + DbContext + UnitOfWork
```

**Impacto:**
- Repositórios: migrados para `DbContext` (não iniciam transações; só executam queries)
- Use cases com múltiplas escritas: envolvem persistência em `UnitOfWork.execute(...)` ou `TransactionManager.runInTransaction(...)` (compat)

**Use cases que receberam transação (27 Abr 2026):**

| Use Case | Módulo | Interface usada | O que é atomizado |
|----------|--------|-----------------|-------------------|
| `RegisterOrganizationWithAdminUseCase` | Auth | `TransactionManager.runInTransaction` | user + organization + membership ADMIN |
| `SetupOrganizationForExistingUserUseCase` | Auth | `TransactionManager.runInTransaction` | organization + membership ADMIN (usuário já existe) |
| `CreateBookingUseCase` | Bookings | `TransactionManager.runInTransaction` | booking + payment — inscrição + registro de pagamento |
| `SubscribeToPlanUseCase` | Subscriptions | `TransactionManager.runInTransaction` | `findActive()` + `save()` — garante max 1 ACTIVE por org |

> Auth e Subscriptions usam `TransactionManager.runInTransaction` por serem implementações anteriores à padronização `UnitOfWork`. `TransactionManager` é um token compat que delega para o mesmo `PrismaUnitOfWork`.

**Compilação/Testes:** ✅ `npx tsc --noEmit` = 0 erros. **Testes: 34 suites, 252 testes (27 Abr). 37 suites, 278 testes (28 Abr). 37 suites, 280 testes (29 Abr — mocks de PlanLimitService adicionados a 4 specs).**

---

## 🔧 FASE 3.6: Análise de Concorrência e Correções (28 Abr 2026)

> Análise completa de race conditions e lost updates em todos os módulos. Auth e Subscriptions já estavam protegidos (27 Abr). As correções de código foram no módulo Trip.

### Auth Module — Já Protegido ✅ (análise 28 Abr)
- ✅ `RegisterOrganizationWithAdminUseCase`: `user + org + membership` dentro de `TransactionManager.runInTransaction` — rollback total se qualquer etapa falhar. Sem alteração necessária.
- ✅ `SetupOrganizationForExistingUserUseCase`: `org + membership` dentro de `TransactionManager.runInTransaction`. Sem alteração necessária.

### Membership Module — Sem Necessidade de Transação ✅ (análise 28 Abr)
- ✅ `CreateMembershipUseCase`: escrita única em uma tabela — não há risco de inconsistência entre múltiplas escritas. Sem alteração necessária.
- ✅ Demais use cases de Membership: operações simples de leitura ou atualização única. Sem risco de race condition identificado.

### Subscriptions Module — Já Protegido ✅ (análise 28 Abr)
- ✅ `SubscribeToPlanUseCase`: `findActive() + save()` dentro de `TransactionManager.runInTransaction` com isolamento Serializable — garante que duas requisições simultâneas não criem duas assinaturas ACTIVE para a mesma organização. Sem alteração necessária.

### Trip Module — Correções Aplicadas ✅ (28 Abr 2026)

#### `TransitionTripInstanceStatusUseCase` — Proteção contra Lost Update
- ✅ Use case envolto em `UnitOfWork.execute(async () => { ... })`
- ✅ Com isolamento `Serializable`, dois requests simultâneos que tentam transitar o mesmo status colidem — apenas um commita, o outro recebe `P2034` e é retentado
- ✅ Mock de `UnitOfWork` adicionado ao spec (`execute: jest.fn().mockImplementation((fn) => fn())`)
- ✅ Construtor atualizado: `new TransitionTripInstanceStatusUseCase(tripInstanceRepository, unitOfWork)`

#### `CreateTripInstanceUseCase` — Proteção contra Race Condition com DeactivateTripTemplate
- ✅ Validações de fast-fail mantidas **fora** da transação (evita lock desnecessário em erros óbvios)
- ✅ Template re-lido **dentro** do `UnitOfWork.execute()` — `isActive()` revalidado sob isolamento Serializable
- ✅ Fecha a janela onde `DeactivateTripTemplate` poderia commitar entre o `findById` externo e o `save`
- ✅ `tripTemplateRepository.findById` chamado duas vezes; testes funcionam sem alteração pois `mockResolvedValue` retorna o mesmo valor em chamadas subsequentes
- ✅ Construtor atualizado: `new CreateTripInstanceUseCase(tripInstanceRepository, tripTemplateRepository, unitOfWork)`

#### `AssignDriverToTripInstance` / `AssignVehicleToTripInstance` — Sem Alteração
- ✅ FK constraints `onDelete: Restrict` confirmados no schema Prisma para `driverId` e `vehicleId` na tabela `TripInstance`
- ✅ Integridade referencial garantida a nível de banco — transações adicionais desnecessárias

**Compilação/Testes:** ✅ 15/15 testes passando após as mudanças.

---

## 🔧 FASE 3.7: Mitigação de Defeitos Críticos (29 Abr 2026)

> Três defeitos que tornavam o sistema não-demonstrável ponta a ponta foram corrigidos sem introduzir complexidade desnecessária (sem cron jobs, sem gateway de pagamento real).

### Payment Simulation ✅ COMPLETO (29 Abr 2026)

**Problema:** Todo booking criava um `Payment` com `status: PENDING` que nunca mudava. A banca veria "pagamento pendente" permanentemente.

**Solução:** Dois endpoints PATCH de simulação, sem gateway externo.

**Novos endpoints:**
| Método | Rota | Auth | O que faz |
|--------|------|------|-----------|
| `PATCH` | `/organizations/:organizationId/payments/:id/confirm` | JWT + ADMIN + TenantFilter | `PENDING → COMPLETED` |
| `PATCH` | `/organizations/:organizationId/payments/:id/fail` | JWT + ADMIN + TenantFilter | `PENDING → FAILED` |

**Mudanças:**
- ✅ `PaymentEntity`: métodos `confirm()` e `fail()` — setam `status` e atualizam `updatedAt`
- ✅ `payment.errors.ts`: `PaymentAlreadyProcessedError` (code `PAYMENT_ALREADY_PROCESSED_BAD_REQUEST` → HTTP 400)
- ✅ `PaymentRepository`: método abstrato `update(payment)` adicionado
- ✅ `PrismaPaymentRepository`: `update()` implementado (`prisma.payment.update`)
- ✅ `ConfirmPaymentUseCase` e `FailPaymentUseCase` criados (guard: só pagamentos PENDING)
- ✅ Endpoints registrados no `PaymentController` e use cases no `PaymentModule`

---

### Subscription Lazy Expiration ✅ COMPLETO (29 Abr 2026)

**Problema:** `expiresAt` existia no banco mas nada mudava o status de `ACTIVE` para `PAST_DUE`. Orgs com assinatura vencida apareciam como ativas.

**Solução:** Expiração lazy (on-demand) — verificação ocorre no momento da consulta, sem cron job.

**Mudanças:**
- ✅ `SubscriptionEntity`: getter `isExpired` + método `expire()` → status `PAST_DUE`, atualiza `updatedAt`
- ✅ `subscription.errors.ts`: 4 novos erros — `NoActiveSubscriptionError` (`NO_ACTIVE_SUBSCRIPTION_FORBIDDEN` → 403), `VehicleLimitExceededError` (`VEHICLE_PLAN_LIMIT_FORBIDDEN` → 403), `DriverLimitExceededError` (`DRIVER_PLAN_LIMIT_FORBIDDEN` → 403), `MonthlyTripLimitExceededError` (`MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN` → 403)
- ✅ Helper `resolveActiveSubscription(orgId, repo)` criado em `application/utils/` — encapsula busca + checagem de expiração + `expire()` + save + retorno null
- ✅ `FindActiveSubscriptionUseCase`: substituída busca direta pelo helper (expiração automática na leitura)
- ✅ `SubscriptionMapper`: status `PAST_DUE` → `activeKey = null` (unicidade respeitada)

---

### Plan Limits Enforcement ✅ COMPLETO (29 Abr 2026)

**Problema:** `maxVehicles`, `maxDrivers`, `maxMonthlyTrips` existiam no `Plan` mas nenhum use case os verificava.

**Solução:** `PlanLimitService` centralizado em `SubscriptionsModule`, injetado nos 3 use cases de criação.

**`PlanLimitService`** (`src/modules/subscriptions/application/services/plan-limit.service.ts`):
- Injeta `SubscriptionRepository` + `PlanRepository`
- `assertVehicleLimit(orgId, count)` — lança `VehicleLimitExceededError` se `count >= plan.maxVehicles`
- `assertDriverLimit(orgId, count)` — lança `DriverLimitExceededError` se `count >= plan.maxDrivers`
- `assertMonthlyTripLimit(orgId, count)` — lança `MonthlyTripLimitExceededError` se `count >= plan.maxMonthlyTrips`
- Privado `getActivePlan()` usa `resolveActiveSubscription` (lazy expiry) → lança `NoActiveSubscriptionError` se sem assinatura ativa

**Contagem nos repositórios:**
- ✅ `VehicleRepository`: `countActiveByOrganizationId(orgId)` — `status: ACTIVE`
- ✅ `DriverRepository`: `countActiveByOrganizationId(orgId)` — `driverStatus: ACTIVE` + membership DRIVER ativa
- ✅ `TripInstanceRepository`: `countByOrganizationAndMonth(orgId, start, end)` — mês calendário atual

**Use cases atualizados:**
- ✅ `CreateVehicleUseCase`: conta veículos ativos → `assertVehicleLimit` antes de `save()`
- ✅ `CreateDriverUseCase`: conta drivers ativos → `assertDriverLimit` (requer `organizationId` como parâmetro opcional)
- ✅ `CreateTripInstanceUseCase`: conta trips do mês → `assertMonthlyTripLimit` antes do `UnitOfWork`
- ✅ Módulos: `VehicleModule`, `DriverModule`, `TripModule` agora importam `SubscriptionsModule`
- ✅ `SubscriptionsModule`: `PlanLimitService` adicionado a `providers` e `exports`

---

### Auto-FREE Subscription no Registro ✅ COMPLETO (29 Abr 2026)

**Problema:** Organizações eram criadas sem subscription, tornando o modelo de monetização invisível e fazendo `PlanLimitService` lançar `NoActiveSubscriptionError` na primeira criação de recurso.

**Solução:** `RegisterOrganizationWithAdminUseCase` chama `SubscribeToPlanUseCase` com plano FREE **após** a transação principal (fora do Serializable para evitar transação aninhada). Falha silenciosa com log de alerta.

**Mudanças:**
- ✅ `RegisterOrganizationWithAdminUseCase`: injetado `SubscribeToPlanUseCase` + `PlanRepository`; auto-subscrição FREE pós-transação com try/catch não-fatal
- ✅ `AuthModule`: importa `SubscriptionsModule` e `PlansModule`
- ✅ `prisma/seed.ts`: 4 planos seedados via upsert — FREE(3v/3d/30t, R$0), BASIC(10/10/100, R$49,9), PRO(30/30/500, R$149,9), PREMIUM(100/100/9999, R$399,9)
- ✅ `SubscriptionsModule`: `SubscribeToPlanUseCase` adicionado aos `exports`

**Nota:** WARN `[RegisterOrg] FREE plan not found` nos testes é esperado — o mock retorna `null` para `findByName`, ativando o branch de falha silenciosa (comportamento correto).

---

## 🕒 FASE 4 (Scheduling): Trip Scheduling — Fase 1 ✅ COMPLETO (16 Mai 2026)

> Pré-requisito do cron de geração recorrente (Fase 4 do guia). Ver `docs/GUIA_TRIP_SCHEDULING.md`.

### Hora-do-dia no `TripTemplate` ✅ COMPLETO (16 Mai 2026)

**Motivação:** desacoplar "horário do roteiro" de "data de execução". Template carrega `HH:mm` UTC fixo; instância carrega só a data. Sem isso, o cron de geração não conseguiria materializar instâncias automaticamente.

**Mudanças:**
- ✅ **Schema Prisma:** `TripTemplate.departureTimeOfDay` + `arrivalTimeOfDay` (`String?` VarChar(5), nullable para migration suave)
- ✅ **Helper `combine-date-and-time.ts`** (`src/modules/trip/domain/utils/`): `isValidTimeOfDay`, `timeOfDayToMinutes`, `combineDateAndTime`, `arrivalCrossesMidnight` — toda lógica em UTC
- ✅ **Domain errors:** `InvalidTripTimeOfDayFormatError`, `InvalidTripTimeOfDayOrderError`, `InvalidTripTemplateMissingScheduleError` (todos com prefixo `INVALID_` → 400)
- ✅ **Entity `TripTemplate`:** novos props/state, validação obrigatória no `create()`, `validateSchedule` (formato + ordem), getters, método `updateSchedule(dep, arr)`
- ✅ **DTOs:** `CreateTripTemplateDto`/`UpdateTripTemplateDto` com `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)`. `CreateTripInstanceDto`: **breaking change** — `departureTime`+`arrivalEstimate` substituídos por `departureDate` (`YYYY-MM-DD`)
- ✅ **Use cases:** `CreateTripTemplateUseCase` repassa campos; `UpdateTripTemplateUseCase` adiciona `updateScheduleIfProvided`; `CreateTripInstanceUseCase` deriva `departureTime`/`arrivalEstimate` via `combineDateAndTime` + `arrivalCrossesMidnight` para casos cruzando meia-noite
- ✅ **Mapper/Presenter:** `toDomain`/`toPersistence`/`toHTTP` incluem os dois campos
- ✅ **Factories de teste:** `makeTripTemplate` aceita `null` (simula linha legada via `restore()`); `makeCreateTripInstanceDto` reescrito com `departureDate`
- ✅ **Specs:** +2 testes no template (formato inválido, arrival==departure), +3 testes na instance (missing schedule, schedule derivation normal, midnight crossing). 3 testes de auto-cancel reescritos com `departureDate`.

**Trade-off documentado:** hora-do-dia é **UTC**. Conversão local é responsabilidade do frontend.

**Validação:**
- `npx tsc --noEmit`: ✅ 0 erros
- `npx jest --config test/jest-unit.json`: ✅ **39 suites, 307 testes** passando (+1 suite, +7 testes vs baseline 04 Mai)
- `npm run lint`: ✅ sem warnings

**Migration aplicada:** `20260516153617_add_time_of_day_to_trip_template` ✅ (16 Mai 2026).

### TripSchedulingConfig per-org ✅ COMPLETO (16 Mai 2026)

**Motivação:** dar a cada organização o controle sobre `daysAhead` (1..90), `generationCron`, `autoCancelCron` e `enabled` — sem isso, os crons das Fases 3-4 ficam presos a defaults globais.

**Estrutura novo módulo `src/modules/scheduling/`:**
- ✅ **Schema:** model `TripSchedulingConfig(organizationId @unique, daysAhead 14, generationCron '0 2 * * *', autoCancelCron '*/15 * * * *', enabled true)`. Relação 1:0..1 com Organization (`onDelete: Cascade`).
- ✅ **Entity:** `create`/`restore`, `validateDaysAhead` (integer 1..90), `validateCron` via `cron-parser.CronExpressionParser.parse`. Métodos `updateDaysAhead`, `updateCrons(gen?, autoCancel?)`, `setEnabled`.
- ✅ **Erros:** `InvalidSchedulingDaysAheadError` (400), `InvalidSchedulingCronError` (400), `TripSchedulingConfigNotFoundError` (404).
- ✅ **Repository:** interface abstract + impl Prisma (`save`, `findByOrganizationId`, `update`) usando `DbContext` (transaction-aware).
- ✅ **Mapper + Presenter + DTOs** seguindo padrão dos demais módulos.
- ✅ **Use cases:** `FindTripSchedulingConfigUseCase`, `UpdateTripSchedulingConfigUseCase` (aplica updates parciais delegando validação à entity).
- ✅ **Controller:** `GET` + `PATCH /organizations/:organizationId/scheduling-config` (`ADMIN` + `TenantFilterGuard`).
- ✅ **Auto-criação no signup:** `RegisterOrganizationWithAdminUseCase` e `SetupOrganizationForExistingUserUseCase` injetam `TripSchedulingConfigRepository` e criam config com defaults após a transação (try/catch não-fatal — mesmo padrão da auto-FREE).
- ✅ **Wiring:** `SchedulingModule` registrado no `AppModule`; `AuthModule` importa `SchedulingModule`.
- ✅ **Deps:** `@nestjs/schedule` + `cron-parser` instaladas (pré-requisito das Fases 3-4).

**Testes adicionados (+2 suites, +22 testes):**
- Entity spec (defaults, validateDaysAhead boundaries 0/-1/91/1.5 rejected; 1/30/90 accepted; cron malformado rejeitado; updateCrons replace parcial; setEnabled flip).
- UpdateTripSchedulingConfigUseCase spec (happy path full update, fields undefined preservados, `TripSchedulingConfigNotFoundError`, propagação `InvalidSchedulingDaysAheadError`, propagação `InvalidSchedulingCronError`).

**Validação:**
- `npx tsc --noEmit`: ✅ 0 erros
- `npx jest --config test/jest-unit.json`: ✅ **41 suites, 329 testes**
- `npm run lint`: ✅ 0 warnings

**Migration aplicada:** `20260516154944_add_trip_scheduling_config` ✅ (16 Mai 2026).

### Cron de auto-cancel ✅ COMPLETO (16 Mai 2026)

**Motivação:** entregar o contrato do `autoCancelEnabled` no template. A cada 15min, viagens cuja `autoCancelAt` já passou e que ainda estão em `DRAFT`/`SCHEDULED`/`CONFIRMED` (não-`forceConfirm`) são transicionadas para `CANCELED`.

**Arquitetura — separação cron ↔ use-case:**
- `@Cron` **não tem regra de negócio**. Toda lógica vive em `CancelExpiredTripInstancesUseCase` (unit-testável sem `@nestjs/schedule`).
- A classe cron envolve o use-case num try/catch defensivo — falhas por instância já são contabilizadas internamente; o catch externo só protege contra exceções top-level (ex.: DB indisponível).

**Mudanças:**
- ✅ `src/app.module.ts`: `ScheduleModule.forRoot()` registrado **condicionalmente** — `DISABLE_CRON=true` mantém scheduler dormente em dev local.
- ✅ `TripInstanceRepository.findExpiredOpenInstances(orgId, threshold)`: interface + impl Prisma. Filtros: `autoCancelAt ≤ threshold AND autoCancelAt NOT NULL AND tripStatus ∈ {DRAFT, SCHEDULED, CONFIRMED} AND forceConfirm = false`. Unpaginated por design (janela pequena; `@@index([autoCancelAt])` no schema).
- ✅ `OrganizationRepository.findAllActiveUnpaginated()`: interface + impl Prisma. Retorna todas as orgs `ACTIVE` em um array (low-cardinality por design; trocar por cursor-based no futuro).
- ✅ `CancelExpiredTripInstancesUseCase`: itera orgs → busca expiradas por org → `instance.transitionTo(CANCELED)` → `update`. Falhas individuais não interrompem o loop. Retorna `{ canceled, failed }`.
- ✅ `AutoCancelTripInstancesCron` (`infrastructure/cron/`): `@Cron('*/15 * * * *', { name: 'auto-cancel-trip-instances' })`.
- ✅ `TripModule` importa `OrganizationModule`; registra o use-case + a cron como providers.

**Trade-offs documentados:**
- **`minRevenue` ignorado no MVP**: qualquer expirada não-`forceConfirm` cancela, mesmo que tenha booking suficiente. Honrar a regra fica como tech-debt.
- **Múltiplas réplicas em prod**: o mesmo cron dispara em paralelo. A state machine (`transitionTo` rejeita transições inválidas) é a defesa em profundidade — pior caso é trabalho duplicado, não corrupção. Pós-MVP: lock distribuído.

**Testes adicionados (+1 suite, +5 testes):**
- 0 orgs ativas → counters zero, lookup interno não chamado.
- N orgs sem expiradas → counters zero, `findExpiredOpenInstances` chamado N vezes.
- 1 org × 3 expiradas → 3 canceladas; cada entidade salva está em `CANCELED`.
- 2 orgs × (1, 2) expiradas → agrega para `canceled = 3`.
- 1 falha em 3 → `{ canceled: 2, failed: 1 }`, loop completa as 3 tentativas.

**Revisão pós-Fase 3 — correções aplicadas (16 Mai 2026):**
- 🐛 **Bug do dotenv:** `import 'dotenv/config'` movido pro topo do `main.ts`. O AppModule lia `process.env.DISABLE_CRON` no decorator, mas o `.env` estava sendo carregado depois — flag nunca surtia efeito.
- ⚠️ **Overlap protection:** flag `isRunning` na cron class. Ticks que chegam durante uma sweep em curso são descartados com warn-log.
- 📋 **Timezone:** `@Cron` agora carrega `timeZone: 'UTC'` explícito, alinhado com a convenção de armazenar tudo em UTC.
- 📋 **`.env` / `.env.example`:** entrada `DISABLE_CRON` documentada. Default `.env` local = `true` (dormente em dev); default `.env.example` = `false` (prod habilita).
- ➕ **Spec da cron class** (+4 testes): happy delegate, overlap skip, retomada após sweep, swallowing de erro top-level + liberação do `isRunning`.

**Validação:**
- `npx tsc --noEmit`: ✅ 0 erros
- `npx jest --config test/jest-unit.json`: ✅ **43 suites, 338 testes** (+2 suites, +9 testes vs Fase 2)
- `npm run lint`: ✅ 0 warnings

**Próximas fases do roteiro:**
- ✅ **Fase 4** — Cron de geração de instâncias recorrentes (`0 2 * * *`) — concluída em 16 Mai 2026 (ver bloco abaixo)
- ⏳ Fase 5 — Endpoint admin para geração manual on-demand

---

## 🛠️ Trip Scheduling — Fase 4 (16 Mai 2026)

### Cron de geração recorrente de TripInstances ✅
- **Novo campo `defaultCapacity` no `TripTemplate`** (`Int?` por compat de migration; entity força positivo no `create()`).
  - Migration `20260516160000_add_default_capacity_to_trip_template`.
  - DTOs (create/update), response DTO, presenter, mapper, factory de teste atualizados.
  - 2 novos domain errors: `InvalidTripTemplateDefaultCapacityError`, `InvalidTripTemplateMissingCapacityError`.
- **Novos métodos de repositório:**
  - `TripTemplateRepository.findActiveRecurringByOrganizationId(orgId)` — retorna todos os templates `ACTIVE + isRecurring=true` da org (unpaginated; cardinalidade baixa pelos plan limits).
  - `TripInstanceRepository.existsForTemplateOnDay(templateId, dayStart, dayEnd)` — checagem de idempotência por (template, dia UTC) usando o índice composto `(tripTemplateId, departureTime)`.
- **`GenerateRecurringTripInstancesUseCase`:**
  - Itera orgs ativas → lê `TripSchedulingConfig` (defaults se ausente; `enabled=false` pula a org).
  - Para cada template recorrente, percorre `[today, today + daysAhead)` em UTC e gera instância se o `DayOfWeek` cair em `template.frequency` e não existir uma instância anterior pra esse (template, dia).
  - Cada inserção checa `PlanLimitService.assertMonthlyTripLimit` com counter local incrementado para evitar hammering no DB. Quando o plano estoura, **pula o resto da janela da org** (não aborta o sweep).
  - Falhas individuais (template malformado, save fail) são contabilizadas em `failed` e logadas — uma linha quebrada não interrompe o resto.
  - Retorna `{ created, skipped, failed }`.
  - Snapshots copiados pro `TripInstance`: `totalCapacity` (do `defaultCapacity`), `isPublic`, `autoCancelAt` (derivado), `minRevenue` (do template se `autoCancelEnabled`).
- **`GenerateRecurringTripInstancesCron`** (`src/modules/trip/infrastructure/cron/`):
  - `@Cron('0 2 * * *', { name: 'generate-recurring-trip-instances', timeZone: 'UTC' })`.
  - Flag `isRunning` para overlap protection (mesmo padrão da auto-cancel cron).
  - `try/catch` top-level engole erros e libera o lock, evitando deadlock no scheduler.
- **`TripModule` agora importa `SchedulingModule`** para injetar `TripSchedulingConfigRepository`.

### Testes adicionados (+2 suites, +12 testes)
- `GenerateRecurringTripInstancesUseCase` (8 testes):
  - 0 orgs ativas → `{0,0,0}`, lookup interno não roda.
  - Org com `enabled=false` → pula sem buscar templates.
  - Org sem templates recorrentes → não consulta monthly count.
  - Template diário em janela de 3 dias → 3 instâncias com `totalCapacity` snapshotado.
  - Template semanal em janela de 14 dias → 2 instâncias (hoje + 7d).
  - Idempotência: `existsForTemplateOnDay=true` → conta como `skipped`, não chama `save`.
  - Plan limit estoura no 2º dia → para gracefully sem incrementar `failed`.
  - `save` falha em 1 dos 3 → `{ created: 2, failed: 1 }`, sweep não aborta.
- `GenerateRecurringTripInstancesCron` (4 testes): delegate happy path, overlap skip, retomada após sweep, swallow de erro + liberação de `isRunning`.

### Validação
- `npx tsc --noEmit`: ✅ 0 erros
- `npx jest --config test/jest-unit.json`: ✅ **45 suites, 350 testes** (+2 suites, +12 testes vs Fase 3 review)
- `npm run lint`: ✅ 0 warnings (Prettier ajustou formatação dos 2 specs novos)

### Decisão registrada
- **`totalCapacity` das instâncias geradas:** novo campo `defaultCapacity` no `TripTemplate`. Alternativas descartadas: copiar `vehicle.capacity` (acopla template ao veículo) e default `0 + ajuste manual` (exige passo extra do admin). O campo é obrigatório no `create()` para forçar pensamento sobre capacidade.

### Migration pendente
- ⚠️ Duas migrations geradas mas **não aplicadas** (Docker estava parado). Rodar `docker-compose up postgres && npx prisma migrate deploy` quando voltar a subir o stack:
  - `20260516160000_add_default_capacity_to_trip_template` — adiciona a coluna `defaultCapacity` (nullable).
  - `20260517100000_cleanup_legacy_and_add_unique_constraint` — limpa templates legados sem schedule/capacity, dedupa rows e adiciona `@@unique([tripTemplateId, departureTime])` no `trip_instance`.

---

## 🛠️ Trip Scheduling — Fase 4 Review (17 Mai 2026)

Crítica auto-aplicada em cima da entrega da Fase 4 — 4 problemas reais identificados e corrigidos, 1 fica como tech-debt.

| # | Severidade | Problema | Fix aplicado |
|---|---|---|---|
| 1 | 🐛 Bug | Erro inesperado numa org (ex: `NoActiveSubscriptionError`) abortava o sweep inteiro — outras orgs ficavam sem geração | `execute()` agora envolve `processOrganization` num try/catch que loga + conta como `failed`, mantendo o sweep andando. |
| 2 | ⚠️ Doc enganosa + race real | A doc dizia "defesa em profundidade" mas a checagem `existsForTemplateOnDay` é race-prone em multi-replica (lê → outro insere → eu insiro = duplicata) | (a) `@@unique([tripTemplateId, departureTime])` no schema. (b) Use-case detecta `P2002` via duck-typing no `code` e conta como `skipped` (não `failed`). (c) Migration `20260517100000` adiciona o índice unique. |
| 3 | 📋 Ineficiência | Plan limit check rodava ANTES da idempotência → desperdiçava chamada em dias que já existiam, podia parar a janela cedo demais | Ordem invertida — past check → idempotência → plan limit → save. |
| 4 | ❓ Design | Cron gerava instâncias com `departureTime` no passado quando rodava após o horário de saída do template | Skip explícito: se `departureTime < now`, conta como `skipped` sem chamar idempotência nem plan limit. |
| 5 | 🛡️ UX op | Templates legados sem `defaultCapacity`/`schedule` poluiriam logs com ERROR diário | Migration `20260517100000` deleta esses templates (cascade em instâncias órfãs). Defensive check no use-case mantém com `break` (em vez de re-tentar cada dia) caso algum slip through manual edit. |

**Defesa em profundidade real contra race:**
1. **In-memory check** (`existsForTemplateOnDay`) — elimina 99.9% dos casos sem hit no DB-write path.
2. **DB unique constraint** (`@@unique([tripTemplateId, departureTime])`) — fecha a janela de race que sobra.
3. **Graceful handling** — `P2002` é detectado e contabilizado como `skipped`, não polui o `failed`.

**Testes adicionados (+4 testes, totalizando 16 no spec do use-case):**
- `should skip today when departureTime is already in the past` — pin `now = 2026-05-17T02:00Z`, template com `departureTimeOfDay = '01:00'` (1h no passado); hoje é pulado, amanhã é criado.
- `should check idempotency BEFORE plan limit` — `existsForTemplateOnDay = true` no único dia da janela; verifica que `assertMonthlyTripLimit` nunca é chamado.
- `should continue the sweep when one org throws an unexpected error` — primeira org rejeita com `NoActiveSubscriptionError`, segunda gera normalmente; `created=1, failed=1`.
- `should treat a unique-constraint race as skipped, not failed` — `save` 2x: primeira sucesso, segunda lança `{ code: 'P2002' }`; resultado `{ created: 1, skipped: 1, failed: 0 }`.

**Tests usam `jest.useFakeTimers()` + `jest.setSystemTime(PINNED_NOW)`** — sem isso o teste de "departureTime passada" era flaky dependendo do horário em que o spec rodava.

**Validação:**
- `npx tsc --noEmit`: ✅ 0 erros.
- `npx jest --config test/jest-unit.json`: ✅ **45 suites, 354 testes** (+4 testes vs Fase 4 inicial).
- `npm run lint`: ✅ 0 warnings.

**Tech-debt remanescente (Fase 4 ↦ pós-MVP):**
- `monthlyCount` em memória pode ficar stale se um admin criar trip manualmente durante o sweep. Para um cron diário às 02:00 UTC é aceitável; pós-MVP, reler o count a cada N iterações.

---

### Testing 📋
- [ ] Unit tests (target: 80%+)
  - [x] User module: ✅ Feito
  - [ ] Organization module: ⏳ Next
  - [ ] Vehicles module: ⏳
  - [ ] Drivers module: ⏳
  - [x] Trips module: ✅ (19 specs, 169 testes — inclui cron auto-cancel + recurring generation com defesa em profundidade contra race)
  - [x] Bookings module: ✅ (9 specs, 85 testes — 25 Abr)
  - [x] Plans module: ✅ (1 spec, 5 testes — 27 Abr)
  - [ ] Payment module: ⏳
  - [x] Subscriptions module: ✅ (1 spec, 7 testes — 27 Abr)

- [ ] Integration tests (E2E)
  - [ ] Auth flow completo
  - [ ] Trip booking flow
  - [ ] Payment webhook

**Comando:** `npm run test:cov`

---

### CI/CD 📋
- [x] GitHub Actions workflow
  - [x] Build step
  - [x] Lint step
  - [x] Test step
  - [ ] Coverage check (≥80%)
- [x] Deploy automático em staging
- [x] Notificações de falha

**Arquivo:** `.github/workflows/ci.yml`

---

### Documentation 📋
- [ ] Swagger/OpenAPI (incremento por módulo)
  - [ ] User endpoints: ✅
  - [ ] Organization endpoints: ⏳
  - [ ] etc...
- [ ] README com setup
- [ ] DOCUMENTACAO_TECNICA.md atualizado
- [ ] Exemplos de curl por endpoint

---

### Deployment 📋
- [ ] Docker image otimizada
- [ ] Docker compose com postgres
- [ ] Environment variables documentadas
- [ ] Health check endpoint

---

## 📝 Próximos Passos

1. **Testes unitários pendentes:**
   - [ ] RegisterUseCase, RefreshTokenUseCase (auth module)
   - [ ] Use cases de CRUD de Driver (FindDriverById, UpdateDriver, etc.)
   - [ ] Use cases de Plans, Payment e Subscriptions

2. ~~**Bookings Module**~~ ✅ **CONCLUÍDO (25 Abr)** — 9 use cases, 85 testes, isolamento multi-tenant, reinscrição após cancelamento

3. ~~**Fase 3 (Monetização)**~~ ✅ **CONCLUÍDA (26 Abr)** — Plans (5 use cases, DevGuard), Payment (read-only, criação via Bookings), Subscriptions (4 use cases, 30 dias, ADMIN-only)

4. **Swagger** — documentação dos endpoints ainda sem `@ApiProperty` completo

---

## 📝 Observações & Decisões

**Blockers Atuais:**
- [x] Database seeding automático → RESOLVIDO (05 Abr)
- [ ] Nenhum blocker técnico identificado

**Decisões Técnicas Implementadas:**
- ✅ **Role-Based Access Control (RBAC):** Implementado Role Entity com upsert para garantir integridade
- ✅ **Database Seeding:** Usando `tsx` + Docker entrypoint para seed automático
- ✅ **Shared Module Pattern:** Padronizado para orquestração de componentes globais
- ✅ **Value Objects:** Telefone e Email com validações de domínio

**Decisões Técnicas Pendentes:**
- [ ] JWT custom vs Supabase Auth? → **Decisão:** Custom (já implementado)
- [ ] ~~Payment provider: Stripe vs PagSeguro?~~ → **Decisão:** Pagamento interno simplificado (sem gateway externo no MVP)
- [ ] Cache (Redis)? Não para MVP
- [ ] Message Queue? Não para MVP
- [ ] WebSockets para live tracking? Depois (V2)

**Riscos:**
- Trips module é complexo (auto-geração CRON)
- Payment integration requer testes cuidadosos

---

