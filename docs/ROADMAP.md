# 🗺️ Roadmap - Movy API (Solo Dev)

> 4 fases claras até MVP. Cheque PROGRESS.md para detalhe de cada módulo.

**Última atualização:** 16 Abr 2026 

---

## ⏱️ Timeline Estimado

```
FASE 1: Mar 31 - Abr 13    (2 semanas)  ✅ 100% COMPLETO (11 Abr 2026)
FASE 2: Abr 14 - Mai 15    (4 semanas)  ⏳ PRÓXIMO
FASE 3: Mai 18 - Jun 01    (2 semanas)  ⏳ FUTURO
FASE 4: Jun 02 - Jun 15    (2 semanas, final polish)  ⏳ FUTURO

MVP PRONTO: 15 de Junho 2026
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
| ⏳ | CI/CD básico (GitHub Actions) | 1 dia |
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

---

## 🚗 Fase 2: Core Business Logic (Abr 14 - Mai 15)

**Objetivo:** Lógica de negócio completa (Vehicles, Drivers, Trips, Bookings)

### Semana 1-2: Frotas (Abr 14-25)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Vehicles CRUD | 3-4 dias |
| ⏳ | Drivers CRUD + LinkVehicles | 3-4 dias |
| ⏳ | Testes dos 2 módulos | 1-2 dias |

**Saída:** Gestão de frotas pronta

### Semana 3-4: Viagens (Abr 28 - Mai 15)
| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Trip Templates | 3-4 dias |
| ⏳ | Trip Instances + Auto-generate | 4-5 dias (COMPLEXO) |
| ⏳ | Bookings (Inscrições) | 3-4 dias |
| ⏳ | Testes E2E trip flow | 2-3 dias |

**Saída:** Sistema de viagens recorrentes + booking funcional

---

## 💰 Fase 3: Monetização (Mai 18 - Jun 01)

**Objetivo:** Transformar em SaaS com pagamentos

| Status | O Quê | Duração |
|:------:|-------|---------|
| ⏳ | Payment integration (Stripe) | 4-5 dias |
| ⏳ | Plans (Free/Pro/Enterprise) | 2 dias |
| ⏳ | Billing + Invoices | 2 dias |
| ⏳ | Testes de pagamento | 2 dias |

**Saída:** SaaS monetizado, pronto pra production

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
✅ 18 Abr  → Vehicles + Drivers prontos
✅ 01 Mai  → Trips + Bookings funcionando
✅ 15 Mai  → Pagamentos integrados
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

### Fase 2 ⏳
```
vehicle/       ⏳ PRÓXIMO (semana 1-2)
trip/          ⏳ PRÓXIMO (semana 2-3, COMPLEXO)
booking/       ⏳ PRÓXIMO (semana 3-4)
```

### Fase 3 ⏳
```
payment/       ⏳ PRÓXIMO (semana 1-2)
plan/          ⏳ PRÓXIMO (semana 1-2)
billing/       ⏳ PRÓXIMO (semana 1-2)
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
- [ ] Organization members 🔄
- [x] Auth JWT ✅
- [ ] Vehicles- CRUD ⏳
- [ ] Drivers CRUD ⏳
- [ ] Trip Templates ⏳
- [ ] Trip Instances ⏳
- [ ] Bookings ⏳
- [ ] Pagamentos (integração) ⏳
- [ ] Plans básicos ⏳
- [ ] Testes 80%+ ⏳
- [ ] Swagger docs ⏳
- [x] Docker ✅ (já tem)
- [ ] README/Setup ✅ (já tem)
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

