# 📊 Progresso do Projeto

> Checklist de desenvolvimento por módulo. Update conforme vai terminando features.

**Última atualização:** 27 Abr 2026

---

## 📈 Resumo Geral

```
Total Módulos: 10
Completo: 10 (100%) - User, Organization, Role Management, Membership, Driver, RBAC Guards, Auth, Vehicle, Trip, Bookings
Em Progresso: 0
Pendente: 0
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
4. `RegisterOrganizationWithAdminUseCase` - Orquestra User → Org → Membership com compensação em 2 estágios *(atualizado 14 Abr)* — ✅ **5 testes** *(16 Abr)*
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
- Compensação em 2 estágios: `compensateUser()` chamado se org ou membership falhar
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
- ✅ `CreateBookingUseCase`: verifica trip → capacity → duplicate → price server-side → `Booking.create()` → save
- ✅ `CancelBookingUseCase`: bloqueia trip `IN_PROGRESS` ou `FINISHED` antes de cancelar
- ✅ `ConfirmPresenceUseCase`: **apenas org members** — owner é bloqueado (`BookingAccessForbiddenError`)
- ✅ `FindBookingsByTripInstanceUseCase`: 3º param `callerOrganizationId?` — bloqueia acesso B2C
- ✅ `FindBookingsByUserUseCase`: 3º param `status?: Status` repassado ao repositório
- ✅ `FindBookingDetailsUseCase`: injeta `BookingRepository` + `TripInstanceRepository`; retorna `BookingDetailsResponseDto`
- ✅ `GetBookingAvailabilityUseCase`: injeta `TripInstanceRepository` + `BookingRepository`; retorna `BookingAvailabilityResponseDto`
- ✅ DTOs novos: `BookingDetailsResponseDto` (extends `BookingResponseDto` + dados da trip), `BookingAvailabilityResponseDto` (`tripInstanceId`, `tripStatus`, `totalCapacity`, `activeCount`, `availableSlots`, `isBookable`)

**Testes Unitários:**
- ✅ 9 suites, **85 testes** — todos passando (total acumulado do projeto: **34 suites, 252 testes** — 27 Abr)
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
- Use cases com múltiplas escritas: envolvem persistência em `UnitOfWork.execute(...)`

**Compilação/Testes:** ✅ `npx tsc --noEmit` = 0 erros. **Testes: 34 suites, 252 testes.**

### Testing 📋
- [ ] Unit tests (target: 80%+)
  - [x] User module: ✅ Feito
  - [ ] Organization module: ⏳ Next
  - [ ] Vehicles module: ⏳
  - [ ] Drivers module: ⏳
  - [x] Trips module: ✅ (11 specs, 90 testes)
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

