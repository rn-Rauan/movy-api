# 🗺️ Roadmap - Movy API (Solo Dev)

> 4 fases claras até MVP. Cheque PROGRESS.md para detalhe de cada módulo.

**Última atualização:** 26 Abr 2026 

---

## ⏱️ Timeline Estimado

```
FASE 1: Mar 31 - Abr 13    (2 semanas)  ✅ 100% COMPLETO (11 Abr 2026)
FASE 2: Abr 14 - Mai 15    (4 semanas)  ✅ COMPLETO (25 Abr 2026)
FASE 3: Abr 26             (1 dia)      ✅ COMPLETO (26 Abr 2026)
FASE 4: Jun 02 - Jun 15    (2 semanas, final polish)  ⏳ FUTURO

MVP PRONTO: 15 de Junho 2026

Progresso em 26 Abr 2026:
  Fase 3 — Plans, Payment e Subscriptions completos (11 use cases, módulos SaaS prontos)
  Total acumulado: 32 suites, 236 testes passando
```

---

## 📍 Fase 1: Fundação (Mar 31 - Abr 13) ✅ 100% COMPLETO (11 Abr 2026)

**Objetivo:** Base sólida com módulos funcionais

| Status | O Quê | Duração |
|:------:|-------|---------|
| ✅ | User module CRUD | ✅ Pronto |
| ✅ | Organization CRUD completo | ✅ Pronto (05 Abr) |
| ✅ | Membership module (associações) | ✅ Pronto (05 Abr) |
| ✅ | Role Management & Seed | ✅ Pronto (05 Abr) |
| ✅ | JWT/Auth setup | ✅ Pronto |
| ✅ | Shared Module padronizado | ✅ Pronto (05 Abr) |
| ✅ | Docker + seed configurado | ✅ Pronto (05 Abr) |
| ✅ | Driver module CRUD completo | ✅ Pronto (11 Abr) |
| ✅ | RBAC Guards + @Dev() decorator | ✅ Pronto (11 Abr) |
| ✅ | TenantContext centralizado | ✅ Pronto (11 Abr) |
| ✅ | Bug fix: Pipeline JWT + Guards | ✅ Pronto (11 Abr) |
| ✅ | Endpoint register-organization (admin + org em uma chamada) | ✅ Pronto (12 Abr) |
| ✅ | JWT Strategy otimizado (sem query ao banco por request) | ✅ Pronto (13 Abr) |
| ✅ | Driver use cases refatorados + error handling aprimorado | ✅ Pronto (13 Abr) |
| ✅ | AllExceptionsFilter refatorado (mapeamento por padrão de código) | ✅ Pronto (13 Abr) |
| ✅ | Organization members (criação de membership ADMIN automática) | ✅ Pronto (12 Abr) |
| ✅ | Organization security hardening (OrganizationForbiddenError, TenantContextParams) | ✅ Pronto (14 Abr) |
| ✅ | Membership DTO simplificado + tenant isolation (organizationId via JWT) | ✅ Pronto (14 Abr) |
| ✅ | Driver prerequisite validation em CreateMembership | ✅ Pronto (14 Abr) |
| ✅ | Decoupling: CreateOrganizationUseCase com SRP, OrganizationModule sem MembershipModule | ✅ Pronto (14 Abr) |
| ✅ | POST /organizations restrito a @Dev() | ✅ Pronto (14 Abr) |
| ✅ | SetupOrganizationForExistingUserUseCase + POST /auth/setup-organization | ✅ Pronto (14 Abr) |
| ✅ | Senior code audit (7.5/10) + 15 correções P2/P3 aplicadas | ✅ Pronto (14-15 Abr) |
| ✅ | Driver architecture redesign (desacoplamento Organization, self-service, lookup) | ✅ Pronto (15 Abr) |
| ✅ | Final sweep + 4 correções (duplicata driver, validação lookup, cleanup deps) | ✅ Pronto (15 Abr) |
| ✅ | Rate limiting global (@nestjs/throttler, 60 req/min) | ✅ Pronto (14 Abr) |
| ✅ | RefreshTokenDto + validação de body | ✅ Pronto (14 Abr) |
| ✅ | Remoção de dead code (6+ arquivos), @Global() do AuthModule, deps não usadas | ✅ Pronto (14-15 Abr) |
| ✅ | tsconfig strict:true + ESLint fix | ✅ Pronto (14 Abr) |
| ✅ | Infraestrutura de testes unitários (Jest config, factories, padrão AAA) | ✅ Pronto (16 Abr) |
| ✅ | Testes: LoginUseCase, RegisterOrgWithAdmin, SetupOrg, CreateMembership, CreateDriver (27 testes) | ✅ Pronto (16 Abr) |
| ✅ | CI/CD básico (GitHub Actions) | ✅ Pronto (16 Abr) |
| ⏳ | Testes 80%+ coverage (use cases restantes: Register, Refresh, CRUDs de User/Org) | 2-3 dias |

**Saída:** API com 3 módulos CRUD, autenticação, roles, associações, seed automático, Docker pronto

**Progresso em 11 Abr 2026:**
- ✅ Membership Module: CRUD completo com soft delete e paginação
- ✅ Organization Module: CRUD 100% completo (6 use cases, 5 value objects)
- ✅ Role Management: Entity, Repository, Seed script funcional
- ✅ Database Seeding: Automático na inicialização do Docker
- ✅ Shared Module: Padronizado com exports organizados
- ✅ Value Objects: Com validações de domínio (Cnpj, Email, Telephone, Address, OrganizationName, Slug, Cnh, CnhCategory)
- ✅ Validation Errors: Sistema robusto de tratamento de erros
- ✅ Global Exception Handling: AllExceptionsFilter traduzindo erros de domínio em respostas HTTP
- ✅ Auth Module: Swagger documentation completa com exemplos
- ✅ Driver Module: CRUD completo (6 use cases, 2 value objects, 100% alinhado com User)
- ✅ RBAC Architecture: @Roles, @Dev(), RolesGuard, TenantFilterGuard, DevGuard implementados
- ✅ TenantContext: Interface centralizada (fonte única de verdade)
- ✅ JwtAuthGuard: Refatorado para popular req.context no momento correto do pipeline
- ✅ Pipeline Corrigido: Middleware → Guards recebem req.context validado
- ✅ DriverMapper: Hidratação de value objects com toDomain/toPersistence
- ✅ Schema Prisma: DriverStatus enum (ACTIVE, INACTIVE, SUSPENDED) com migrations
- ✅ Compilação: TypeScript ✅ sem erros
- ✅ Validação em Produção: Testado em dev server - req.context populando corretamente

**Progresso em 12-13 Abr 2026:**
- ✅ Auth Module: Endpoint `POST /auth/register-organization` implementado (admin + org em uma chamada)
- ✅ Auth Module: `RegisterOrganizationWithAdminUseCase` e `RegisterOrganizationWithAdminDto` criados
- ✅ Organization Module: `CreateOrganizationUseCase` atualizado para criar membership ADMIN automaticamente
- ✅ JWT Strategy: Otimizado para não consultar banco a cada request autenticado
- ✅ Driver Module: Use cases e repository refatorados com error handling mais robusto
- ✅ AllExceptionsFilter: Refatorado com mapeamento de erros por padrão de código
- ✅ TypeScript: Imports migrados para `import type` + configuração ajustada
- ✅ Compilação: ✅ sem erros

**Progresso em 14 Abr 2026:**
- ✅ Organization Module: `OrganizationForbiddenError` adicionado (código `ORGANIZATION_ACCESS_FORBIDDEN` → HTTP 403)
- ✅ Organization Module: `TenantContextParams` movido para `application/dtos/index.ts` (acoplamento removido entre use-cases)
- ✅ Organization Module: `ForbiddenException` (@nestjs/common) removido dos 3 use-cases de org → substituído por `OrganizationForbiddenError`
- ✅ Membership Module: `CreateMembershipDto` simplificado para `{ userEmail: string, roleId: number }` (removido `userId?` e `organizationId` do body)
- ✅ Membership Module: `organizationId` agora vem exclusivamente do JWT (isolamento de tenant na criação)
- ✅ Membership Module: `GET /memberships/user/:userId` filtrado pela org do caller (não-devs não veem dados de outras orgs)
- ✅ Membership Module: Validação de prerequisito Driver implementada (`DriverNotFoundForMembershipError`, `DriverNotAssociatedWithOrganizationError`)
- ✅ Membership Module: Erros de Driver corrigidos para sufixos reconhecidos pelo AllExceptionsFilter (`_BAD_REQUEST`)
- ✅ Membership Module: Ordem de validação corrigida — validação de Driver ocorre ANTES da checagem de soft-delete
- ✅ Organization Module: `CreateOrganizationUseCase` refatorado para SRP — apenas cria org, sem deps de Membership/Role
- ✅ Auth Module: `RegisterOrganizationWithAdminUseCase` atualizado como orquestrador completo (User → Org → Membership + compensação)
- ✅ Organization Module: `POST /organizations` restrito a `@Dev()` — fluxo real passa pelo `/auth/register-organization`
- ✅ Organization Module: `OrganizationModule` sem `forwardRef(MembershipModule)` — zero acoplamento
- ✅ Auth Module: `SetupOrganizationForExistingUserUseCase` criado — usuário já logado pode criar org e receber novo JWT
- ✅ Auth Module: `POST /auth/setup-organization` endpoint implementado (requer JWT válido)
- ✅ Senior Code Audit: Nota 7.5/10, 5 críticos / 7 médios / 8 menores identificados
- ✅ Compilação: ✅ sem erros (`npx tsc --noEmit`)

**Progresso em 15 Abr 2026 (Senior Audit Fixes + Driver Redesign):**
- ✅ **15 correções P2/P3 do audit aplicadas:**
  - P3: `RefreshTokenDto` criado com class-validator
  - M2: `@nestjs/throttler` instalado e configurado (60 req/min global via APP_GUARD)
  - M3: Dead code deletado (UserOrganizationRoleResolver, MembershipUserOrgRoleResolver)
  - M4: Consolidação `GetTenantContext` → `GetUser` (decorator duplicado removido)
  - M5: `TenantFilterGuard` — lógica B2C corrigida (removida checagem frágil de `params.id`)
  - M6: `@Global()` removido do `AuthModule`
  - M7: `npm audit fix` removido do `Dockerfile`
  - m1: ESLint fix (removido `@eslint/eslintrc` incompatível com flat config)
  - m2: Teste e2e corrigido (`'Hello World!'` → `'Api Initialized'`)
  - m3: Dead code files + diretórios vazios deletados
  - m4: `GetTenantId`: `ForbiddenException` → `BadRequestException`
  - m5: `@supabase/supabase-js` removido do package.json
  - m6: `restore_membership()` → `restoreMembership()` (3 arquivos)
  - m7: `tsconfig.json`: `strict: true` substituiu flags individuais
  - m8: `movy_db_data/` adicionado ao `.gitignore`
- ✅ **Driver Architecture Redesign (desacoplamento de Organization):**
  - `organizationId` removido do model `Driver` (migration `remove_org_from_driver` aplicada)
  - Drivers agora vinculados a orgs via `OrganizationMembership` (tabela pivot existente)
  - `POST /drivers` agora é self-service (usuário cria próprio perfil, userId vem do JWT)
  - Novo `LookupDriverUseCase`: admin busca driver por email + CNH (verificação de identidade)
  - Novo `GET /drivers/lookup` endpoint (ADMIN only)
  - Novo `DriverLookupResponseDto`, `DriverProfileNotFoundByEmailError`
  - `findByOrganizationId` reimplementado via JOIN: `user.userRoles.some({ organizationId, role.name: DRIVER })`
  - Novo `findByCnh()` no `DriverRepository`
  - `DriverModule` importa `UserModule` (para `UserRepository` no LookupDriverUseCase)
  - `CreateMembershipUseCase` simplificado: removido `DriverNotAssociatedWithOrganizationError` (não mais necessário)
- ✅ **Final sweep + 4 correções adicionais:**
  - `@supabase/supabase-js` removido das dependencies (havia persistido)
  - `@types/passport-jwt` movido de dependencies para devDependencies
  - `CreateDriverUseCase`: check de duplicata adicionado (`DriverAlreadyExistsError` → HTTP 409)
  - `GET /drivers/lookup`: validação de query params `email` e `cnh` (não podem ser vazios)
- ✅ Compilação: ✅ sem erros (`npx tsc --noEmit`)

**Progresso em 16 Abr 2026 (Infraestrutura de Testes Unitários):**
- ✅ **Infraestrutura de testes criada:**
  - `test/jest-unit.json` com rootDir, testRegex, moduleNameMapper para aliases `src/`
  - Padrão AAA (Arrange-Act-Assert) com `makeMocks()` + `setupHappyPath()` + `sut`
  - Factories por módulo: `makeUser`, `makeOrganization`, `makeRole`, `makeJwtPayload`, `makeMembership`, `makeDriver`
  - Factories de DTO: `makeRegisterOrgDto`, `makeSetupOrgDto`, `makeCreateDriverDto`
  - Injeção manual de dependências (sem mocks de framework)
- ✅ **5 suites de teste, 27 testes passando:**
  - `LoginUseCase`: 5 testes (happy path, user not found, inactive, wrong password)
  - `RegisterOrganizationWithAdminUseCase`: 5 testes (happy path, orquestração, compensação org/membership/role)
  - `SetupOrganizationForExistingUserUseCase`: 6 testes (happy path, user not found, inactive, role not found, membership fails)
  - `CreateMembershipUseCase`: 7 testes (happy path ADMIN/DRIVER, restore soft-deleted, user not found, driver missing, already exists)
  - `CreateDriverUseCase`: 4 testes (happy path, check duplicata, DriverAlreadyExistsError, DriverCreationFailedError)
- ✅ Compilação: ✅ sem erros (`npx tsc --noEmit`)
- ✅ Testes: ✅ 27/27 passando (`npx jest --config test/jest-unit.json`)
**Progresso em 17 Abr 2026 (Vehicle Module + IDOR Security Fixes):**
- ✅ **Vehicle Module: CRUD completo implementado**
  - Entity `VehicleEntity` com `Plate` value object, enums `VehicleType`/`VehicleStatus`
  - 8 domain errors (inclusive `VehicleAccessForbiddenError`, `VehicleInactiveError`)
  - Repository interface + `PrismaVehicleRepository` + `VehicleMapper`
  - 5 use cases: Create, FindById, FindAllByOrganization, Update, Remove
  - DTOs com class-validator + Swagger, Presenter, Controller com 5 endpoints
  - `VehicleModule` wired no `AppModule`
- ✅ **Vehicle IDOR fix (OWASP A01 — Broken Access Control)**
  - `FindVehicleByIdUseCase`, `UpdateVehicleUseCase`, `RemoveVehicleUseCase` verificam `organizationId` do JWT
  - Controller passa `context.organizationId!` nos endpoints `GET /:id`, `PUT /:id`, `DELETE /:id`
- ✅ **Vehicle Inactive protection**
  - `UpdateVehicleUseCase` rejeita atualização se `status === INACTIVE` (`VehicleInactiveError`)
- ✅ **Driver IDOR fix (OWASP A01)**
  - `DriverAccessForbiddenError` adicionado aos domain errors
  - `belongsToOrganization(driverId, organizationId)` adicionado na interface e implementação Prisma
  - `FindDriverByIdUseCase`, `UpdateDriverUseCase`, `RemoveDriverUseCase` agora verificam ownership via membership
  - Controller passa `context.organizationId!` nos 3 endpoints afetados
- ✅ **Membership audit**: confirmado protegido — `organizationId` no route param já é validado pelo `TenantFilterGuard`
- ✅ **Vehicle README.md** criado com documentação completa
- ✅ Compilação: ✅ sem erros

**Progresso em 21 Abr 2026 (Trip Module + Organization/Membership updates):**
- ✅ **Trip Module: implementado completo**
  - `TripTemplate` e `TripInstance` — entidades, repositórios, use cases, DTOs, controllers
  - 12 endpoints REST (5 template + 7 instância)
  - Status machine: SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED
  - `AssignDriverToTripInstance` e `AssignVehicleToTripInstance` com suporte a null (desatribuir)
- ✅ **Bug fix: FK violations no Trip module**
  - `AssignDriverToTripInstanceUseCase`: valida existência do driver antes do `update()` — HTTP 400 em vez de 500
  - `AssignVehicleToTripInstanceUseCase`: valida existência do veículo antes do `update()` — HTTP 400 em vez de 500
  - `VehicleModule` agora exporta `VehicleRepository` (bug: estava faltando)
  - `TripModule` importa `DriverModule` e `VehicleModule`
- ✅ **Organization Module — `GET /organizations/me`**
  - `FindOrganizationByUserUseCase` criado, registrado e exportado
  - Endpoint acessível por ADMIN e DRIVER — retorna orgs do usuário logado (paginado)
- ✅ **Membership Module — `GET /memberships/me/role/:organizationId`**
  - `FindRoleByUserIdAndOrganizationIdUseCase` exposto via HTTP
  - `RoleResponseDto` criado (`{ id, name: RoleName }`) com Swagger
  - Acessível por ADMIN e DRIVER — sem `TenantFilterGuard` (isolamento implícito pelo `userId` do token)
- ✅ Compilação: ✅ sem erros

---

## 🚗 Fase 2: Core Business Logic (Abr 14 - Mai 15)

**Objetivo:** Lógica de negócio completa (Vehicles, Drivers, Trips, Bookings)

### Semana 1-2: Frotas (Abr 14-25)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ✅ | Vehicles CRUD | ✅ Pronto (17 Abr) |
| ✅ | Vehicle IDOR fix + VehicleInactiveError | ✅ Pronto (17 Abr) |
| ✅ | Driver IDOR fix (belongsToOrganization) | ✅ Pronto (17 Abr) |
| ⏳ | Testes dos 2 módulos | 1-2 dias |

**Saída:** Gestão de frotas pronta

### Semana 3-4: Viagens (Abr 28 - Mai 15)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ✅ | Trip Templates | ✅ Pronto (21 Abr) |
| ✅ | Trip Instances + Assign Driver/Vehicle | ✅ Pronto (21 Abr) |
| ✅ | FK violation fix (Driver/Vehicle validação) | ✅ Pronto (21 Abr) |
| ✅ | Organization `GET /me` + `FindOrganizationByUserUseCase` | ✅ Pronto (21 Abr) |
| ✅ | Membership `GET /me/role/:orgId` + `RoleResponseDto` | ✅ Pronto (21 Abr) |
| ✅ | Bookings (Inscrições) — 9 use cases, 85 testes | ✅ Pronto (25 Abr) |
| ⏳ | Testes E2E trip flow | 2-3 dias |

**Saída:** Sistema de viagens recorrentes + booking funcional

---

## 💰 Fase 3: Monetização ✅ COMPLETO (26 Abr 2026)

**Objetivo:** Transformar em SaaS com planos e histórico de pagamentos

| Status | O Quê | Duração |
|:------:|-------|---------|
| ✅ | Plans (FREE/BASIC/PRO/PREMIUM) — 5 use cases, DevGuard | ✅ Pronto (26 Abr) |
| ✅ | Payment — read-only API, criação pelo BookingsModule | ✅ Pronto (26 Abr) |
| ✅ | Subscriptions — 4 use cases, 30 dias, ADMIN-only | ✅ Pronto (26 Abr) |

**Saída:** Módulos SaaS prontos — planos, histórico de pagamentos, assinaturas por organização

---

## 🔧 Fase 4: Qualidade & Deploy (Jun 02 - Jun 15)

**Objetivo:** Polish final, documentação, pronto para TCC

| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Swagger completo (todos endpoints) | 2-3 dias |
| ⏳ | Documentação TCC | 3-4 dias |
| ⏳ | Docker + Docker-compose prod | 1-2 dias |
| ⏳ | Testes finais + bug fixes | 2-3 dias |
| ⏳ | Deploy em staging/demo | 1 dia |

**Saída:** MVP production-ready + documentação completa

---

## 🎯 Milestones

```
✅ 04 Abr  → User + Org modules, Auth básica
✅ 18 Abr  → Vehicles + Drivers prontos (Vehicle 17 Abr, Driver 11+17 Abr)
✅ 01 Mai  → Trips + Bookings funcionando
✅ 26 Abr  → Pagamentos + Planos + Assinaturas (Fase 3 antecipada)
✅ 15 Jun  → MVP deployado + TCC documentado
```

---

## 📊 Módulos por Fase

### Fase 1 ✅ 100% COMPLETO (11 Abr 2026)
```
user/          ✅ COMPLETO
organization/  ✅ COMPLETO (CRUD)
auth/          ✅ COMPLETO
driver/        ✅ COMPLETO
membership/    ✅ COMPLETO
roles/         ✅ COMPLETO
rbac/          ✅ COMPLETO (Guards + Decorators)
shared/        ✅ COMPLETO
```

### Fase 2 ✅ COMPLETO (25 Abr 2026)
```
vehicle/       ✅ COMPLETO (17 Abr)
trip/          ✅ COMPLETO (21 Abr) — TripTemplate + TripInstance + FK fixes
booking/       ✅ COMPLETO (25 Abr) — 9 use cases, lógica B2C + org-only, controller REST, 85 testes
```

### Fase 3 ✅ COMPLETO (26 Abr 2026)
```
plans/         ✅ COMPLETO (26 Abr) — 5 use cases, DevGuard, PlanName enum (FREE/BASIC/PRO/PREMIUM)
payment/       ✅ COMPLETO (26 Abr) — read-only API, criação pelo BookingsModule, PaymentRepository exportado
subscriptions/ ✅ COMPLETO (26 Abr) — 4 use cases, 30 dias, ADMIN-only, depende de PlansModule
```

### Fase 4 🔧
```
Testes E2E, Swagger, Docker, Deploy, Docs
```

---

## 📝 Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Trips module complexo | Alto | Começar cedo, testar bem |
| Payment integration bugs | Alto | Mock Stripe para dev, testes cuidadosos |
| Multi-tenant bugs | Médio | Testar com 2+ orgs |
| Database migrations | Médio | Versionar migrations, backup antes |

---

## 📋 Checklist MVP Mínimo

- [x] User CRUD ✅
- [x] Organization CRUD ✅
- [x] Organization members ✅
- [x] Vehicles- CRUD ✅ (17 Abr)
- [x] Drivers CRUD ✅ (11 Abr, IDOR fix 17 Abr)
- [x] Trip Templates ✅ (21 Abr)
- [x] Trip Instances ✅ (21 Abr)
- [x] Bookings ✅ (25 Abr)
- [x] Pagamentos (histórico interno) ✅ (26 Abr)
- [x] Plans básicos ✅ (26 Abr)
- [x] Subscriptions ✅ (26 Abr)
- [x] Auth JWT ✅
- [x] Docker ✅ 
- [x] README/Setup ✅ 
- [ ] Swagger docs ⏳
- [ ] Testes 80%+ ⏳
- [ ] Documentação TCC ⏳

---

## 💡 Notas Importantes

**Não entrar em scope creep:**
- ❌ WebSockets/Live tracking (V2)
- ❌ Mobile app (V2)
- ❌ Admin dashboard (V2)
- ❌ Notificações por email/SMS (V2)
- ❌ Relatórios avançados (V2)

**Manter foco em:**
- ✅ API REST funcional
- ✅ Lógica de negócio sólida
- ✅ Testes automatizados
- ✅ Documentação clara

---

**Ver detalhes em:** [PROGRESS.md](./PROGRESS.md)

