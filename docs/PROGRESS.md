# 📊 Progresso do Projeto

> Checklist de desenvolvimento por módulo. Update conforme vai terminando features.

**Última atualização:** 21 Abr 2026

---

## 📈 Resumo Geral

```
Total Módulos: 9
Completo: 9 (100%) - User, Organization, Role Management, Membership, Driver, RBAC Guards, Auth, Vehicle, Trip
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

### Bookings Module 📋 (~5-7 dias)

**Inscrição em Viagens:**
- [ ] POST `/bookings` - Inscrever passageiro em viagem
  - Validar: capacidade disponível, user ativo, trip disponível
- [ ] GET `/bookings` - Minhas inscrições
- [ ] GET `/trips/:id/bookings` - Passageiros da viagem
- [ ] DELETE `/bookings/:id` - Cancelar inscrição

**Validações:**
- [ ] Não permitir inscrição duplicada (mesmo user, mesma viagem)
- [ ] Validar capacidade: não deixar inscrever se lotado
- [ ] Soft-delete: marcar como CANCELLED (não deletar)

**Sistema de Fila (opcional - adicionár depois):**
- [ ] Quando lotado, adicionar em waitlist
- [ ] Liberar vagas quando alguém cancela (promover da fila)

**Arquivos:**
```
src/modules/booking/
├── application/dtos/
│   └── create-booking.dto.ts
├── domain/
│   ├── entities/booking.entity.ts
│   ├── errors/booking.errors.ts
│   └── interfaces/booking.repository.ts
├── infrastructure/repositories/
│   └── prisma-booking.repository.ts
├── presentation/controllers/
│   └── booking.controller.ts
└── booking.module.ts
```

---

## 💰 FASE 3: Monetização (Mai-Jun 2026)

### Payments Module 📋 (~7-10 dias)

**Integração com Stripe (recomendado):**
- [ ] Criar conta Stripe
- [ ] POST `/payments/checkout` - Gerar session de pagamento
- [ ] Webhook de confirmação de pagamento
- [ ] Salvar histórico de transações

**Alternativa:** PagSeguro ou Mercado Pago

**Arquivos:**
```
src/modules/payment/
├── infrastructure/
│   └── providers/
│       ├── stripe.provider.ts
│       └── payment.adapter.ts
├── domain/
│   └── entities/payment.entity.ts
├── application/services/
│   └── payment.service.ts
└── payment.module.ts
```

---

### Plans & Billing 📋 (~3-5 dias)

**Planos:**
- [ ] FREE: básico, limite de trips/mês
- [ ] PRO: sem limites, suporte prioritário
- [ ] ENTERPRISE: customizado

**Campos:**
- [ ] price, max_trips_month, features, duration_days

**Faturamento:**
- [ ] POST `/billing/invoice` - Gerar invoice
- [ ] GET `/billing/invoices` - Histórico
- [ ] Incluir payment_id da transação

---

## 🔧 FASE 4: Qualidade & DevOps (Contínuo)

### Testing 📋
- [ ] Unit tests (target: 80%+)
  - [ ] User module: ✅ Feito
  - [ ] Organization module: ⏳ Next
  - [ ] Vehicles module: ⏳
  - [ ] Drivers module: ⏳
  - [ ] Trips module: ⏳ (complexo)
  - [ ] Bookings module: ⏳
  - [ ] Payments module: ⏳

- [ ] Integration tests (E2E)
  - [ ] Auth flow completo
  - [ ] Trip booking flow
  - [ ] Payment webhook

**Comando:** `npm run test:cov`

---

### CI/CD 📋
- [ ] GitHub Actions workflow
  - [ ] Build step
  - [ ] Lint step
  - [ ] Test step
  - [ ] Coverage check (≥80%)
- [ ] Deploy automático em staging
- [ ] Notificações de falha

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

## 📝 Próximos Passos (Ordem)

1. **Esta semana (05-07 Abr):** 
   - [ ] Implementar Organization members associação com roles
   - [ ] Guards de permissão baseados em Role (RBAC)
   - [ ] Coverage de testes ≥80%

2. **Semana 1-2 (08-20 Abr):**
   - [ ] Implementar Vehicles CRUD
   - [ ] Implementar Drivers CRUD
   - [ ] Setup CI/CD com GitHub Actions

3. **Semana 2-3 (21-01 Mai):**
   - [ ] Trip Templates module
   - [ ] Trip Instances auto-generation com CRON

4. **Semana 3-4 (04-15 Mai):**
   - [ ] Bookings module completo
   - [ ] Testes E2E

5. **Semana 4-5 (18-29 Mai):**
   - [ ] Integração de Pagamentos (Stripe)
   - [ ] Plans (Free/Pro/Enterprise)

6. **Semana 5-6 (01-15 Jun):**
   - [ ] Swagger completo
   - [ ] Documentação TCC

7. **Semana 6-7 (18+ Jun):**
   - [ ] Polish, testes finais
   - [ ] Deploy staging/production
   - [ ] **MVP PRONTO**

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
- [ ] Payment provider: Stripe vs PagSeguro? → **Decisão:** Stripe
- [ ] Cache (Redis)? Não para MVP
- [ ] Message Queue? Não para MVP
- [ ] WebSockets para live tracking? Depois (V2)

**Riscos:**
- Trips module é complexo (auto-geração CRON)
- Payment integration requer testes cuidadosos

---

