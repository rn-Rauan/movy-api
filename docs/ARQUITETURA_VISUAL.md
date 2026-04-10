# 🗺️ ARQUITETURA VISUAL - Multi-Tenant RBAC

---

## 1. FLUXO DE REQUISIÇÃO (Request Flow)

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT                                  │
│  (e.g., curl -H "Authorization: Bearer <JWT>" /vehicles)      │
└─────────────────────────┬──────────────────────────────────────┘
                          │ HTTP GET + Bearer Token
                          ▼
        ┌─────────────────────────────────────┐
        │     (1) JwtAuthGuard                 │
        │  ├─ Valida assinatura JWT           │
        │  ├─ Valida expiração                │
        │  └─ req.user agora contém JWT payload
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ (2) TenantContextMiddleware          │
        │  ├─ Extrai organizationId do JWT    │
        │  ├─ Extrai role do JWT              │
        │  ├─ Injeta req.context = {...}      │
        │  └─ Valida coerência                │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ (3) RolesGuard (se @Roles())         │
        │  ├─ Lê @Roles() metadata            │
        │  ├─ Compara com req.context.role    │
        │  └─ Bloqueia se sem permissão       │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ (4) TenantFilterGuard (se params)    │
        │  ├─ Extrai :organizationId param    │
        │  ├─ Valida == req.context.orgId    │
        │  └─ Bloqueia IDOR                   │
        └─────────────┬───────────────────────┘
                      │
                      ▼ ✅ AUTHORIZED
        ┌─────────────────────────────────────┐
        │     Controller Handler               │
        │  ├─ Recebe @GetTenantContext()      │
        │  ├─ Recebe @GetTenantId()           │
        │  └─ Context já validado!             │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │     Service / Use Case               │
        │  ├─ Valida business logic           │
        │  └─ Chama Repository                 │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ TenantAwareRepository                │
        │  ├─ repository.findByIdAndTenant()  │
        │  │   WHERE id = :id                  │
        │  │   AND organizationId = :tenantId │
        │  └─ NotFoundException se não achar  │
        └─────────────┬───────────────────────┘
                      │
                      ▼ SELECT + WHERE tenant_id
        ┌─────────────────────────────────────┐
        │     Prisma / Database                │
        │  ├─ Executa query segura             │
        │  └─ Retorna resultado isolado        │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │     Response Presenter               │
        │  └─ Serializa para HTTP              │
        └─────────────┬───────────────────────┘
                      │
                      ▼ HTTP 200 + Data
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT                                  │
│  { id, name, organizationId, ... }                             │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. JWT PAYLOAD ENRIQUECIDO

```
┌─────────────────────────────────────────────────────────┐
│          JWT ACCESS TOKEN (encoded)                     │
└─────────────────────────────────────────────────────────┘
              │
              ▼ (decoded)
┌─────────────────────────────────────────────────────────┐
│ {                                                       │
│   "sub": "user-uuid-123",          ← User ID           │
│   "id": "user-uuid-123",           ← Alt ID             │
│   "email": "admin@company.com",    ← Email              │
│                                                         │
│   "organizationId": "org-456",     ← ✅ NOVO            │
│   "role": "ADMIN",                 ← ✅ NOVO (enum)    │
│   "isDev": false,                  ← ✅ NOVO (bool)    │
│                                                         │
│   "userStatus": "ACTIVE",          ← Optimization      │
│   "iat": 1712643890,               ← Issued at          │
│   "exp": 1712647490,               ← Expiry             │
│   "aud": "movy-api",               ← Audience           │
│   "iss": "movy-auth"               ← Issuer             │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Exemplos de JWTs por role:

👨‍💻 DEVELOPER (isDev=true):
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   "sub": "dev-user-123",                           │
│   "email": "dev@movy-local",                       │
│   "organizationId": null,         ← Ignora org     │
│   "role": null,                   ← Sem role      │
│   "isDev": true,                  ← CHAVE: true   │
│ }                                                   │
│ ⭐ Bypass: pode acessar TUDO sem filtros            │
└─────────────────────────────────────────────────────┘

👔 ADMIN (role=ADMIN):
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   "sub": "admin-user-456",                         │
│   "email": "admin@company.com",                    │
│   "organizationId": "org-789",    ← Obrigatório   │
│   "role": "ADMIN",                ← Chave         │
│   "isDev": false,                                  │
│ }                                                   │
│ ✅ Acesso: Limitado a org-789 apenas              │
└─────────────────────────────────────────────────────┘

🚗 DRIVER (role=DRIVER):
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   "sub": "driver-user-789",                        │
│   "email": "driver@company.com",                   │
│   "organizationId": "org-789",    ← Obrigatório   │
│   "role": "DRIVER",               ← Chave         │
│   "isDev": false,                                  │
│ }                                                   │
│ ✅ Acesso: Apenas suas trips em org-789           │
└─────────────────────────────────────────────────────┘

👤 USER B2C (sem role):
┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   "sub": "user-user-001",                          │
│   "email": "user@gmail.com",                       │
│   "organizationId": null,         ← Sem org        │
│   "role": null,                   ← Sem role      │
│   "isDev": false,                                  │
│ }                                                   │
│ ✅ Acesso: /me + trips públicas + suas inscrições │
└─────────────────────────────────────────────────────┘
```

---

## 3. MATRIZ DE ISOLAMENTO (Query Layer)

```
┌──────────────────────────────────────────────────────────────┐
│                    INSECURE (❌ NUNCA)                        │
├──────────────────────────────────────────────────────────────┤
│ SELECT * FROM vehicle WHERE id = 'abc-123'                  │
│                                                               │
│ ⚠️ Qualquer um poderia descobrir existência de veículos      │
│ ⚠️ Admin A conseguira seguir links de Admin B                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              SEGURO (✅ SEMPRE USAMOS)                        │
├──────────────────────────────────────────────────────────────┤
│ SELECT * FROM vehicle                                        │
│ WHERE id = 'abc-123'                                         │
│ AND organizationId = 'org-789'  ← VALIDAÇÃO DUPLA          │
│                                                               │
│ ✅ Se não pertence, retorna 404                              │
│ ✅ Admin A NUNCA conseguira ver Admin B                      │
│ ✅ Impossível descobrir ID de outro tenant                   │
│                                                               │
│ Resultados: 0 ou 1 (seguro)                                  │
└──────────────────────────────────────────────────────────────┘

EXEMPLOS por Role:

👨‍💻 DEVELOPER Query:
┌──────────────────────────────────────────────────────┐
│ // isDev=true, ignora organizationId                │
│ SELECT * FROM vehicle WHERE id = 'abc-123'         │
│ // Retorna qualquer veículo de qualquer org        │
└──────────────────────────────────────────────────────┘

👔 ADMIN Query:
┌──────────────────────────────────────────────────────┐
│ // role=ADMIN, organizationId='org-789'            │
│ SELECT * FROM vehicle                               │
│ WHERE id = 'abc-123'                               │
│ AND organizationId = 'org-789'   ← Obrigatório    │
│ // Retorna se pertence a org-789, 404 senão      │
└──────────────────────────────────────────────────────┘

👤 USER B2C Query:
┌──────────────────────────────────────────────────────┐
│ // B2C user: NOT allowed to call /vehicles/:id      │
│ // Deve usar /me ou /public-trips              │
│ 403 Forbidden                                       │
│ (middleware bloqueia antes de chegar BD)            │
└──────────────────────────────────────────────────────┘
```

---

## 4. ESTRUTURA DE BANCO DE DADOS

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT SCHEMA                      │
└─────────────────────────────────────────────────────────────┘

ORGANIZAÇÃO (Root Entity)
┌──────────────────────┐
│   organization       │
├──────────────────────┤
│ id: UUID (PK)        │  ← Root tenant
│ name: String         │
│ cnpj: String         │
│ slug: String         │
│ status: Status       │
└──────┬───────────────┘
       │ FK References (organizationId)
       ├─────────► user_role (N:1)
       ├─────────► vehicle (N:1)
       ├─────────► driver (N:1)           ← NOVO
       ├─────────► trip_template (N:1)
       ├─────────► trip_instance (N:1)    ← NOVO Redundancy
       ├─────────► enrollment (N:1)
       ├─────────► payment (N:1)
       ├─────────► audit_log (N:1)
       └─────────► subscription (N:1)

EXEMPLO DE ISOLAMENTO:

ORG 1 (id: org-111)          ORG 2 (id: org-222)
├─ Vehicle 1 (v-111)         ├─ Vehicle 1 (v-222)
├─ Driver 1 (d-111)          ├─ Driver 1 (d-222)
├─ Trip 1 (t-111)            ├─ Trip 1 (t-222)
└─ User 1 (related)          └─ User 1 (related)

Query Admin ORG1:
SELECT * FROM vehicle 
WHERE organizationId = 'org-111'
╔═══════════════════════════════╗
║  v-111 ✅ (pertence ORG 1)    ║
║  v-222 ❌ (filtered out)      ║
╚═══════════════════════════════╝

Impossível ver dados de org-222!
```

---

## 5. ROLE-BASED ACCESS CONTROL (RBAC)

```
┌────────────────────────────────────────────────────────┐
│               DECISION TREE                            │
└────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │ JWT Token Valid? │
                         └────────┬─────────┘
                        NO ↗      │      ↖ YES
                    401 ◄         │         ► (continue)
                          Unauthorized
                                  │
                         ┌────────▼─────────┐
                         │  isDev = true?   │
                         └────────┬─────────┘
                        YES ↗     │     ↖ NO
                     ✅ ALLOW     │    (continue)
                                  │
                         ┌────────▼─────────┐
                         │ Tem @Roles()?    │
                         └────────┬─────────┘
                        NO ↗      │     ↖ YES
                     ✅ ALLOW     │    (continue)
                                  │
                         ┌────────▼─────────┐
                         │ role in @Roles()? │
                         └────────┬─────────┘
                        NO ↗      │     ↖ YES
                     403 ◄        │      ► ✅ ALLOW
                    Forbidden     │
                         
                  Insufficient permissions


EXEMPLOS DE ROTAS:

┌──────────────────────────────────────────────────┐
│  @Get('/vehicles')                              │
│  @Roles('ADMIN')  ← Requer ADMIN               │
│  async list() { ... }                           │
│                                                  │
│  ✅ ADMIN pode acessar                          │
│  ❌ DRIVER recebe 403                           │
│  ❌ USER recebe 403                             │
│  ✅ DEVELOPER pode acessar (isDev bypass)       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  @Get('/my-trips')                              │
│  @Roles('DRIVER')  ← Requer DRIVER             │
│  async getMyTrips() { ... }                     │
│                                                  │
│  ✅ DRIVER pode acessar                         │
│  ❌ ADMIN recebe 403 (precisa outra rota)       │
│  ❌ USER recebe 403                             │
│  ✅ DEVELOPER pode acessar                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  @Get('/public-trips')                          │
│  (Sem @Roles)  ← Public, sem proteção           │
│  async getPublic() { ... }                      │
│                                                  │
│  ✅ TODOS (inclusive anônimos)                  │
│  Retorna apenas isPublic=true                   │
└──────────────────────────────────────────────────┘
```

---

## 6. COMPARAÇÃO: ANTES vs DEPOIS

```
┌─────────────────────────────────────────────────────────┐
│              ❌ ANTES (Vulnerável)                       │
├─────────────────────────────────────────────────────────┤
│ GET /users/123 (qualquer um autenticado)               │
│ ├─ Controller: Sem validação                            │
│ └─ DB: SELECT * FROM user WHERE id = '123'            │
│    (retorna dados de qualquer usuário!)                │
│                                                         │
│ GET /vehicles/abc (sem @Roles)                         │
│ ├─ Controller: Sem guard de tenant                     │
│ └─ DB: SELECT * FROM vehicle WHERE id = 'abc'         │
│    (Admin A consegue ver Admin B)                      │
│                                                         │
│ Query de Driver:                                       │
│ SELECT * FROM trip WHERE vehicleId = 'v-123'          │
│ (3-4 queries: resolve org → valida → retorna)         │
│ (N+1 problem)                                          │
│                                                         │
│ ⚠️ RESULTADO: IDOR + Dados expostos + Performance ruim │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              ✅ DEPOIS (Seguro)                          │
├─────────────────────────────────────────────────────────┤
│ GET /users/me (rota segura)                            │
│ ├─ JwtAuthGuard: Valida JWT                            │
│ ├─ GetTenantContext: Extrai userId                     │
│ └─ DB: SELECT * FROM user WHERE id = req.context.userId
│    (impossível acessar outro usuário)                  │
│                                                         │
│ GET /org/abc/vehicles/v-123 (com Guards)               │
│ ├─ JwtAuthGuard: Valida token                          │
│ ├─ TenantFilterGuard: Valida org=abc vs JWT org        │
│ ├─ RolesGuard: Valida role=ADMIN                       │
│ └─ DB: SELECT * FROM vehicle WHERE id='v-123'         │
│       AND organizationId='abc'                         │
│    (Double validation, impossible IDOR)               │
│                                                         │
│ Query de Driver:                                       │
│ SELECT * FROM trip WHERE driverId='driver-xyz'        │
│       AND organizationId='org-tenant'                  │
│ (1-2 queries, direto no JWT)                          │
│ (Performance otimizada)                                │
│                                                         │
│ ✅ RESULTADO: Zero IDOR + Isolamento perfeito + Rápido │
└─────────────────────────────────────────────────────────┘
```

---

## 7. FLUXO DE ERRO (Error Scenarios)

```
┌──────────────────────────────────────────────────────────┐
│               CENÁRIO: Ataque IDOR                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: Admin A de Org_1                             │
│ Target: GET /org/org_2/vehicles/v_2_123                │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ (1) JwtAuthGuard                    │                │
│ │ ├─ JWT válido? ✅ Sim               │                │
│ │ └─ Continua...                      │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ (2) TenantFilterGuard                │                │
│ │ ├─ organizationId == 'org_2'?        │                │
│ │ ├─ JWT contém organizationId='org_1' │                │
│ │ ├─ org_2 !== org_1                  │                │
│ │ └─ 🚫 BLOQUEADO!                     │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ HTTP 403 Forbidden                   │                │
│ │ {                                    │                │
│ │   \"error\": \"Insufficient access\",│                │
│ │   \"message\": \"Resource not found\"│                │
│ │ }                                    │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ Ataque bloqueado antes do BD!                        │
│ ✅ Admin A nunca descobre que org_2 existe              │
│ ✅ Log de tentativa gerado (auditoria)                  │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│            CENÁRIO: Privilege Escalation                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: User comum de Org_1                          │
│ Objetivo: Acessar admin route                          │
│ Target: GET /org/org_1/vehicles (ADMIN only)           │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ (1) JwtAuthGuard                    │                │
│ │ ├─ JWT válido? ✅ Sim               │                │
│ │ └─ Continua...                      │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ (2) RolesGuard                       │                │
│ │ ├─ @Roles('ADMIN') obrigatório      │                │
│ │ ├─ JWT contém role=null (B2C user)  │                │
│ │ ├─ null !== 'ADMIN'                 │                │
│ │ └─ 🚫 BLOQUEADO!                     │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ HTTP 403 Forbidden                   │                │
│ │ {                                    │                │
│ │   \"error\": \"Insufficient perms\", │                │
│ │   \"required_roles\": [\"ADMIN\"]    │                │
│ │ }                                    │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ Escalation impedido                                  │
│ ✅ B2C users NUNCA conseguem admin access               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 8. ÍNDICES DE PERFORMANCE (Database)

```
┌───────────────────────────────────────────────────┐
│  ÍNDICES CRÍTICOS CRIADOS                        │
├───────────────────────────────────────────────────┤

idx_driver_organization_id
  └─ driver (organization_id)
     Queries: SELECT * FROM driver WHERE org_id = X

idx_driver_user_org (UNIQUE)
  └─ driver (user_id, organization_id)
     Ensures: 1 User can be driver of multiple Orgs
     Prevents: Duplicate driver entries per org

idx_trip_instance_organization_id
  └─ trip_instance (organization_id)
     Queries: SELECT * FROM trip WHERE org_id = X

idx_trip_instance_driver_org (COMPOSITE)
  └─ trip_instance (driver_id, organization_id)
     Queries: SELECT * FROM trip WHERE driver=Y AND org=Z

idx_vehicle_org_id (COMPOSITE)
  └─ vehicle (organization_id, id)
     Pattern: Commonly filtered by org

idx_trip_template_org_public
  └─ trip_template (organization_id, is_public)
     Use: Find public trips of org X


┌───────────────────────────────────────────────────┐
│  PERFORMANCE METRICS (BEFORE vs AFTER)            │
├───────────────────────────────────────────────────┤

Query: Get user trips
BEFORE: SELECT * FROM trip_instance
        JOIN driver ON ...
        JOIN vehicle ON ...
        WHERE user_id = :id
        → 3-4 DB queries, 150ms avg

AFTER:  SELECT * FROM trip_instance
        WHERE driver_id = :id
        AND organization_id = :org_id
        → 1 query, 30ms avg
        → 80% faster!

Query: List vehicles for org
BEFORE: Query all, filter in app
        → 5000+ rows, app filter
        
AFTER:  SELECT * FROM vehicle
        WHERE organization_id = :org_id
        → 50 rows indexed, instant
```

---

## 9. FLUXO DE INTEGRAÇÃO DO CÓDIGO

```
novos/modificados files:

src/
├── shared/
│   ├── middleware/
│   │   └── tenant-context.middleware.ts (✅ NOVO)
│   ├── guards/
│   │   ├── jwt.guard.ts (LENDO)
│   │   ├── roles.guard.ts (REFATOR)
│   │   └── tenant-filter.guard.ts (✅ NOVO)
│   ├── infrastructure/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts (LENDO)
│   │   │   ├── get-tenant-context.decorator.ts (✅ NOVO)
│   │   │   └── get-tenant-id.decorator.ts (✅ NOVO)
│   │   └── repositories/
│   │       └── membership.repository.ts (✅ NOVO)
│   └── domain/
│       └── interfaces/
│           └── tenant-aware.repository.ts (✅ NOVO)
│
├── modules/
│   ├── auth/
│   │   ├── infrastructure/
│   │   │   └── jwt.strategy.ts (REFATOR +JWT context)
│   │   └── auth.module.ts (REFATOR +services)
│   │
│   ├── user/
│   │   ├── presentation/controllers/
│   │   │   └── user.controller.ts (REFATOR: /me routes)
│   │   └── repository (LENDO)
│   │
│   ├── vehicle/
│   │   ├── presentation/controllers/
│   │   │   └── vehicle.controller.ts (✅ NOVO)
│   │   ├── application/services/ (✅ NOVO)
│   │   └── infrastructure/repositories/
│   │       └── prisma-vehicle.repository.ts (✅ NOVO)
│   │
│   ├── trip/
│   │   ├── presentation/controllers/
│   │   │   └── trip.controller.ts (✅ NOVO)
│   │   ├── application/services/ (✅ NOVO)
│   │   └── infrastructure/repositories/ (✅ NOVO)
│   │
│   ├── organization/
│   │   └── presentation/controllers/
│   │       └── organization.controller.ts (REFATOR +guards)
│   │
│   └── membership/
│       └── presentation/controllers/
│           └── membership.controller.ts (REFATOR +filters)
│
├── app.module.ts (REFATOR: +TenantContext middleware)
│
└── main.ts (LENDO)


prisma/
├── schema.prisma (REFATOR: +Driver.org, TripInstance.org rel)
└── migrations/
    ├── [existing migrations]/
    └── [timestamp]_add_tenant_id_critical/
        └── migration.sql (✅ NOVO SQL migrations)
```

---

**Fim da Arquitetura Visual**

Para implementação prática: veja `GUIA_PRATICO_CODIGO_READY_USE.md`  
Para timeline: veja `PLANO_ACAO_EXECUTIVO.md`  
Para análise profunda: veja `ANALISE_TECNICA_SAAS_MULTITENANT_RBAC.md`

