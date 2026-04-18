# 🗺️ ARQUITETURA VISUAL - Multi-Tenant RBAC

> Atualizado em 17 Abr 2026 — reflete a implementação real do código.

---

## 1. FLUXO DE REQUISIÇÃO (Request Flow)

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT                                  │
│  (e.g., curl -H "Authorization: Bearer <JWT>" /vehicles/:id)   │
└─────────────────────────┬──────────────────────────────────────┘
                          │ HTTP + Bearer Token
                          ▼
        ┌─────────────────────────────────────┐
        │     (1) JwtAuthGuard                 │
        │  ├─ Valida assinatura JWT           │
        │  ├─ Valida expiração                │
        │  ├─ Extrai payload enriquecido      │
        │  └─ Popula req.context = {          │
        │       userId, email,                │
        │       organizationId, role, isDev    │
        │     } (TenantContext)                │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ (2) RolesGuard (se @Roles())         │
        │  ├─ Lê @Roles() metadata            │
        │  ├─ isDev=true? → bypass           │
        │  └─ role ∈ requiredRoles? → allow  │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ (3) TenantFilterGuard               │
        │  ├─ isDev=true? → bypass           │
        │  ├─ B2C user (sem org)? → 403     │
        │  ├─ Se :organizationId no path:    │
        │  │    compara param vs JWT orgId   │
        │  └─ Se só :id no path:             │
        │       passa (use case valida)       │
        └─────────────┬───────────────────────┘
                      │
                      ▼ ✅ AUTHORIZED
        ┌─────────────────────────────────────┐
        │     Controller Handler               │
        │  ├─ Recebe @GetUser() → context   │
        │  └─ Passa organizationId ao UC     │
        └─────────────┬───────────────────────┘
                      │
         ────────────┼───────────────
        │                            │
        ▼ PATH A                     ▼ PATH B
  Rota com :orgId            Rota só com :id
  (ex: POST/GET              (ex: GET/PUT/DELETE
   /vehicles/org/:orgId)      /vehicles/:id)
        │                            │
        ▼                            ▼
  TenantFilterGuard          Use Case valida
  JÁ validou orgId           ownership:
  → query direta             │
        │                     ├─ Vehicle: compara
        │                     │  vehicle.organizationId
        │                     │  !== jwt.organizationId
        │                     │  → VehicleAccessForbiddenError
        │                     │
        │                     └─ Driver: chama
        │                        belongsToOrganization()
        │                        via membership JOIN
        │                        → DriverAccessForbiddenError
        │                            │
        └────────────┼───────────────
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │     Prisma / Database                │
        │  ├─ Executa query segura             │
        │  └─ Retorna resultado isolado        │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │     Presenter                        │
        │  └─ toHTTP() → serializa resposta  │
        └─────────────┬───────────────────────┘
                      │
                      ▼ HTTP 200 + Data
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT                                  │
│  { id, plate, model, organizationId, ... }                      │
└────────────────────────────────────────────────────────────────┘

NOTA: Não existe TenantContextMiddleware. O TenantContext é populado
diretamente pelo JwtAuthGuard ao validar o JWT. O payload já contém
todos os dados necessários (userId, organizationId, role, isDev),
sem query ao banco por request.
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
       ├─────────► user_role (N:1)          ← OrganizationMembership
       ├─────────► vehicle (N:1)            ← FK direta ✅
       ├─────────► trip_template (N:1)     ← Futuro
       ├─────────► trip_instance (N:1)     ← Futuro
       ├─────────► enrollment (N:1)       ← Futuro
       ├─────────► payment (N:1)          ← Futuro
       └─────────► subscription (N:1)     ← Futuro

⚠️  DRIVER NÃO TEM FK DIRETA PARA ORGANIZATION!
    Driver → User → OrganizationMembership → Organization
    Vínculo é via tabela pivot user_role (permite driver multi-org)

VEHICLE (FK direta)           DRIVER (sem FK, via membership)
┌─────────────────────┐     ┌─────────────────────┐
│ vehicle              │     │ driver               │
├─────────────────────┤     ├─────────────────────┤
│ id: UUID (PK)        │     │ id: UUID (PK)        │
│ plate: String @unique│     │ userId: String @unique│
│ model: String        │     │ cnh: String @unique  │
│ type: VehicleType    │     │ cnhCategory: String  │
│ maxCapacity: Int     │     │ cnhExpiresAt: Date   │
│ status: Status       │     │ driverStatus: Status │
│ organizationId: FK ✅ │     │ (sem organizationId!)│
└─────────────────────┘     └─────────────────────┘

Vehicle: verificado         Driver: verificado via
diretamente via             belongsToOrganization()
vehicle.organizationId      query: user.userRoles.some(
!== jwt.organizationId        { organizationId, removedAt: null }
→ VehicleAccessForbidden    )
                            → DriverAccessForbidden

EXEMPLO DE ISOLAMENTO:

ORG 1 (id: org-111)          ORG 2 (id: org-222)
├─ Vehicle 1 (v-111)         ├─ Vehicle 1 (v-222)
├─ Driver 1 (via membership) ├─ Driver 2 (via membership)
└─ Admin (via membership)    └─ Admin (via membership)

Driver 1 pode pertencer a ORG 1 E ORG 2 simultaneamente!
(vínculo via OrganizationMembership, não FK direta)

Query Admin ORG1 (vehicles):
SELECT * FROM vehicle
WHERE organizationId = 'org-111'
╔═══════════════════════════════╗
║  v-111 ✅ (pertence ORG 1)    ║
║  v-222 ❌ (filtered out)      ║
╚═══════════════════════════════╝

Query Admin ORG1 (drivers):
SELECT * FROM driver
WHERE user.userRoles.some(
  { organizationId: 'org-111', removedAt: null, role: 'DRIVER' }
)
╔═══════════════════════════════╗
║  d-111 ✅ (membership ORG 1)  ║
║  d-222 ❌ (filtered out)      ║
╚═══════════════════════════════╝
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
│ GET /vehicles/abc (sem validação de ownership)         │
│ ├─ Controller: Busca por ID sem checar org             │
│ └─ DB: SELECT * FROM vehicle WHERE id = 'abc'         │
│    (Admin A consegue ver veículo de Admin B!)          │
│                                                         │
│ GET /drivers/xyz (mesmo problema)                       │
│ ├─ Controller: Busca por ID sem checar org             │
│ └─ DB: SELECT * FROM driver WHERE id = 'xyz'          │
│    (Qualquer admin vê qualquer driver!)                │
│                                                         │
│ PUT /vehicles/abc (atualiza veículo inativo)            │
│ ├─ Controller: Sem check de status                     │
│ └─ Permite alterar veículo soft-deleted!                │
│                                                         │
│ ⚠️ RESULTADO: IDOR + Dados expostos + Soft delete bypass │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              ✅ DEPOIS (Seguro — 17 Abr 2026)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ═══ VEHICLE (FK direta) ═══                            │
│                                                         │
│ GET /vehicles/organization/:orgId (listagem)            │
│ ├─ TenantFilterGuard: orgId param == JWT orgId ✅       │
│ ├─ RolesGuard: @Roles(ADMIN) ✅                        │
│ └─ DB: WHERE organizationId = :orgId                   │
│                                                         │
│ GET /vehicles/:id (busca por ID)                        │
│ ├─ RolesGuard: @Roles(ADMIN) ✅                        │
│ ├─ Controller: passa context.organizationId ao UC      │
│ ├─ UseCase: vehicle.organizationId !== jwt.orgId?      │
│ │  → VehicleAccessForbiddenError (403)                 │
│ └─ Impossível acessar veículo de outra org              │
│                                                         │
│ PUT /vehicles/:id (atualização)                         │
│ ├─ UseCase: ownership check (como acima)               │
│ ├─ UseCase: vehicle.isActive()?                        │
│ │  → VehicleInactiveError (410 Gone) se INACTIVE       │
│ └─ Soft-deleted não pode ser atualizado ✅              │
│                                                         │
│ ═══ DRIVER (sem FK, via membership JOIN) ═══            │
│                                                         │
│ GET /drivers/:id (busca por ID)                         │
│ ├─ RolesGuard: @Roles(ADMIN) ✅                        │
│ ├─ Controller: passa context.organizationId ao UC      │
│ ├─ UseCase: belongsToOrganization(driverId, orgId)     │
│ │  query: driver.user.userRoles.some({                  │
│ │    organizationId, removedAt: null                     │
│ │  })                                                   │
│ │  false → DriverAccessForbiddenError (403)             │
│ └─ Impossível acessar driver de outra org               │
│                                                         │
│ ═══ MEMBERSHIP (protegido via route param) ═══          │
│                                                         │
│ Todas as rotas incluem :organizationId no path          │
│ → TenantFilterGuard valida automaticamente              │
│ → Sem necessidade de check no use case                  │
│                                                         │
│ ✅ RESULTADO: Zero IDOR + Isolamento perfeito + Seguro   │
└─────────────────────────────────────────────────────────┘
```

---

## 7. FLUXO DE ERRO (Error Scenarios)

```
┌──────────────────────────────────────────────────────────┐
│     CENÁRIO 1: IDOR via route com :organizationId        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: Admin A de Org_1                              │
│ Target: GET /vehicles/organization/org_2                 │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ (1) JwtAuthGuard                    │                │
│ │ ├─ JWT válido? ✅ Sim               │                │
│ │ └─ Popula req.context              │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ (2) TenantFilterGuard                │                │
│ │ ├─ param.organizationId = 'org_2'   │                │
│ │ ├─ JWT organizationId = 'org_1'     │                │
│ │ ├─ org_2 !== org_1                  │                │
│ │ └─ 🚫 BLOQUEADO!                     │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ HTTP 403 Forbidden                   │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ Ataque bloqueado ANTES de chegar ao BD!               │
│ ✅ Admin A nunca descobre que org_2 existe               │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│     CENÁRIO 2: IDOR via route só com :id (Vehicle)       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: Admin A de Org_1                              │
│ Target: GET /vehicles/v_org2_123                         │
│ (veículo que pertence a Org_2)                           │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ (1) JwtAuthGuard         ✅        │                │
│ │ (2) RolesGuard (ADMIN)   ✅        │                │
│ │ (3) TenantFilterGuard    ✅        │                │
│ │     (sem :orgId no path, passa)   │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ (4) FindVehicleByIdUseCase          │                │
│ │ ├─ Busca vehicle no BD              │                │
│ │ ├─ vehicle.organizationId = org_2   │                │
│ │ ├─ jwt.organizationId = org_1       │                │
│ │ ├─ org_2 !== org_1                  │                │
│ │ └─ throw VehicleAccessForbiddenError│                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ AllExceptionsFilter                  │                │
│ │ code: 'VEHICLE_ACCESS_FORBIDDEN'     │                │
│ │ sufixo _FORBIDDEN → HTTP 403        │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ Ataque bloqueado na camada de USE CASE                │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│     CENÁRIO 3: IDOR via route só com :id (Driver)        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: Admin A de Org_1                              │
│ Target: GET /drivers/d_org2_456                          │
│ (driver vinculado apenas a Org_2 via membership)         │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ Guards passam (sem :orgId no path)  │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ FindDriverByIdUseCase                │                │
│ │ ├─ Busca driver no BD               │                │
│ │ ├─ belongsToOrganization(           │                │
│ │ │    driverId, jwt.organizationId)   │                │
│ │ ├─ Query: driver.user.userRoles      │                │
│ │ │  .some({ orgId, removedAt: null }) │                │
│ │ ├─ Resultado: false (não pertence)  │                │
│ │ └─ throw DriverAccessForbiddenError │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ AllExceptionsFilter                  │                │
│ │ code: 'DRIVER_ACCESS_FORBIDDEN'      │                │
│ │ sufixo _FORBIDDEN → HTTP 403        │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ Ownership verificado via OrganizationMembership JOIN  │
│ ✅ Sem FK direta, então check é no use case              │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│     CENÁRIO 4: Update de veículo soft-deleted            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Admin tenta: PUT /vehicles/v_123                         │
│ Body: { plate: 'ABC1234' }                               │
│ (veículo já foi removido via DELETE, status=INACTIVE)    │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ UpdateVehicleUseCase                 │                │
│ │ ├─ Busca vehicle ✅                  │                │
│ │ ├─ Ownership check ✅               │                │
│ │ ├─ vehicle.isActive()? ❌ INACTIVE  │                │
│ │ └─ throw VehicleInactiveError       │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ AllExceptionsFilter                  │                │
│ │ code: 'VEHICLE_INACTIVE_GONE'       │                │
│ │ match genérico → HTTP 500*          │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ * sufixo _GONE não está mapeado no filter atual.        │
│   Considerar adicionar mapeamento → HTTP 410.           │
│                                                          │
│ ✅ Veículos desativados não podem ser alterados          │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│     CENÁRIO 5: Privilege Escalation                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Attacker: User B2C (sem org, sem role)                  │
│ Target: GET /vehicles/organization/org_1                 │
│                                                          │
│ ┌─────────────────────────────────────┐                │
│ │ (1) JwtAuthGuard         ✅        │                │
│ │ (2) RolesGuard                      │                │
│ │     @Roles(ADMIN) required         │                │
│ │     JWT role = null (B2C)          │                │
│ │     null !== 'ADMIN'               │                │
│ │     🚫 BLOQUEADO!                    │                │
│ └──────────────┬──────────────────────┘                │
│                │                                        │
│ ┌──────────────▼──────────────────────┐                │
│ │ HTTP 403 Forbidden                   │                │
│ └──────────────────────────────────────┘                │
│                                                          │
│ ✅ B2C users NUNCA acessam rotas admin                   │
│ ✅ Bloqueio no RolesGuard antes do TenantFilterGuard     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7.1 AllExceptionsFilter — Mapeamento DomainError → HTTP

```
┌───────────────────────────────────────────────────────────┐
│  TABELA DE MAPEAMENTO (sufixo do code → HTTP status)     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  *_NOT_FOUND              → 404 Not Found                 │
│  *_ALREADY_EXISTS         → 409 Conflict                  │
│  INVALID_* | *_BAD_REQUEST → 400 Bad Request              │
│  *_FORBIDDEN              → 403 Forbidden                 │
│  *_UNAUTHORIZED           → 401 Unauthorized              │
│  (qualquer outro)         → 500 Internal Server Error     │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  EXEMPLOS REAIS:                                          │
│                                                           │
│  VEHICLE_ACCESS_FORBIDDEN      → 403                      │
│  DRIVER_ACCESS_FORBIDDEN       → 403                      │
│  ORGANIZATION_ACCESS_FORBIDDEN → 403                      │
│  VEHICLE_NOT_FOUND             → 404                      │
│  DRIVER_NOT_FOUND              → 404                      │
│  PLATE_ALREADY_IN_USE          → 409                      │
│  DRIVER_ALREADY_EXISTS         → 409                      │
│  INVALID_PLATE                 → 400                      │
│  INVALID_MAX_CAPACITY          → 400                      │
│  VEHICLE_INACTIVE_GONE         → 500 (sem match _GONE)   │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  RESPONSE BODY:                                           │
│  {                                                        │
│    "statusCode": 403,                                     │
│    "timestamp": "2026-04-17T...",                          │
│    "path": "/vehicles/abc-123",                            │
│    "message": "Access denied to this vehicle",             │
│    "error": "VEHICLE_ACCESS_FORBIDDEN"                     │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
```

---

## 8. ÍNDICES DE PERFORMANCE (Database)

```
┌───────────────────────────────────────────────────┐
│  ÍNDICES EXISTENTES NO SCHEMA (17 Abr 2026)      │
├───────────────────────────────────────────────────┤

vehicle @@index([organizationId])
  └─ Queries: WHERE organizationId = :orgId
     Usado por: FindAllVehiclesByOrganization

vehicle @@index([status])
  └─ Queries: filtros por status ACTIVE/INACTIVE

driver @unique(userId)
  └─ Garante 1 perfil driver por user
     Index implícito via @unique

driver @unique(cnh)
  └─ Garante unicidade de CNH no sistema
     Index implícito via @unique

vehicle @unique(plate)
  └─ Garante unicidade de placa no sistema
     Index implícito via @unique

user_role @@id([userId, roleId, organizationId])
  └─ Chave composta da membership
     Previne membership duplicada

┌───────────────────────────────────────────────────┐
│  NOTA: Driver NÃO tem index de organizationId     │
│  (removido em 15 Abr — redesign arquitetural)    │
│  Queries de driver por org usam JOIN via          │
│  user.userRoles.some({ organizationId })          │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│  PERFORMANCE: JWT Strategy otimizada              │
├───────────────────────────────────────────────────┤

ANTES (até 13 Abr):
  Cada request autenticado:
  → JWT validate → userRepository.findById()
  → 1 query extra por request = latência

DEPOIS:
  Cada request autenticado:
  → JWT validate → retorna payload direto
  → 0 queries ao BD por request
  → Payload enriquecido no login com
    userId, organizationId, role, isDev
```

---

## 9. ESTRUTURA REAL DO CÓDIGO (17 Abr 2026)

```
src/
├── main.ts
├── app.module.ts
├── app.controller.ts
│
├── shared/
│   ├── shared.module.ts
│   ├── index.ts                            # barrel export
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── role.entity.ts
│   │   │   └── value-objects/
│   │   │       ├── email.value-object.ts
│   │   │       └── telephone.value-object.ts
│   │   ├── errors/
│   │   │   ├── domain.error.ts             # abstract DomainError base
│   │   │   ├── roles.error.ts
│   │   │   └── validation.error.ts
│   │   ├── interfaces/
│   │   │   ├── paginated.response.ts
│   │   │   ├── pagination.options.ts
│   │   │   └── role.repository.ts
│   │   └── types/
│   │       ├── role-name.enum.ts           # ADMIN, DRIVER
│   │       └── status.type.ts              # ACTIVE | INACTIVE
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   ├── mappers/role.mapper.ts
│   │   │   └── repositories/prisma-role.repository.ts
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts       # @GetUser() → TenantContext
│   │   │   ├── get-tenant-id.decorator.ts  # @GetTenantId() → string
│   │   │   ├── roles.decorator.ts          # @Roles(...)
│   │   │   └── dev.decorator.ts            # @Dev()
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts                # JwtAuthGuard (popula req.context!)
│   │   │   ├── roles.guard.ts              # RolesGuard (isDev bypass)
│   │   │   ├── tenant-filter.guard.ts      # TenantFilterGuard
│   │   │   └── dev.guard.ts                # DevGuard
│   │   └── types/
│   │       ├── jwt-payload.interface.ts     # JwtPayload
│   │       └── tenant-context.interface.ts  # TenantContext
│   │
│   ├── presentation/
│   │   ├── dtos/paginated.dto.ts
│   │   ├── exceptions/
│   │   │   └── all-exceptions.filter.ts    # DomainError → HTTP mapping
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts
│   │       └── tenant-context.interceptor.ts  # ⚠️ DEPRECATED
│   │
│   └── providers/
│       └── hash/bcrypt-hash.provider.ts
│
├── modules/
│   ├── auth/          ✅ COMPLETO
│   │   ├── application/use-cases/
│   │   │   ├── login.use-case.ts
│   │   │   ├── register.use-case.ts
│   │   │   ├── refresh-token.use-case.ts
│   │   │   ├── register-organization-with-admin.use-case.ts
│   │   │   └── setup-organization-for-existing-user.use-case.ts
│   │   ├── infrastructure/jwt.strategy.ts
│   │   ├── presentation/controllers/auth.controller.ts
│   │   └── auth.module.ts
│   │
│   ├── user/          ✅ COMPLETO
│   │   ├── application/ (dtos + use-cases)
│   │   ├── domain/ (entity + errors + interfaces)
│   │   ├── infrastructure/ (mapper + repository)
│   │   ├── presentation/ (controller + presenter)
│   │   └── user.module.ts
│   │
│   ├── organization/  ✅ COMPLETO
│   │   ├── application/ (dtos + use-cases)
│   │   ├── domain/ (entity + errors + value-objects + interfaces)
│   │   ├── infrastructure/ (mapper + repository)
│   │   ├── presentation/ (controller + presenter)
│   │   └── organization.module.ts
│   │
│   ├── membership/    ✅ COMPLETO
│   │   ├── application/ (dtos + use-cases)
│   │   ├── domain/ (entity + errors + interfaces)
│   │   ├── infrastructure/ (mapper + repository)
│   │   ├── presentation/ (controller + presenter)
│   │   └── membership.module.ts
│   │
│   ├── driver/        ✅ COMPLETO (IDOR fix 17 Abr)
│   │   ├── application/
│   │   │   ├── dtos/ (create, update, response, lookup-response)
│   │   │   └── use-cases/ (7: create, update, findById,
│   │   │       findByUserId, findByOrg, remove, lookup)
│   │   ├── domain/
│   │   │   ├── entities/driver.entity.ts
│   │   │   ├── entities/errors/driver.errors.ts  # 11+ tipos
│   │   │   ├── value-objects/ (cnh, cnh-category)
│   │   │   └── interfaces/driver.repository.ts
│   │   │       # inclui belongsToOrganization() ← NOVO 17 Abr
│   │   ├── infrastructure/
│   │   │   ├── db/mappers/driver.mapper.ts
│   │   │   └── db/repositories/prisma-driver.repository.ts
│   │   ├── presentation/
│   │   │   ├── controllers/driver.controller.ts
│   │   │   └── mappers/driver.presenter.ts
│   │   ├── driver.module.ts
│   │   └── README.md
│   │
│   └── vehicle/       ✅ COMPLETO (17 Abr)
│       ├── application/
│       │   ├── dtos/ (create, update, response)
│       │   └── use-cases/ (5: create, findById,
│       │       findAllByOrg, update, remove)
│       ├── domain/
│       │   ├── entities/vehicle.entity.ts
│       │   ├── entities/errors/vehicle.errors.ts  # 8 tipos
│       │   ├── entities/value-objects/plate.value-object.ts
│       │   └── interfaces/vehicle.repository.ts
│       │       # inclui enums VehicleType, VehicleStatus
│       ├── infrastructure/
│       │   ├── db/mappers/vehicle.mapper.ts
│       │   └── db/repositories/prisma-vehicle.repository.ts
│       ├── presentation/
│       │   ├── controllers/vehicle.controller.ts
│       │   └── mappers/vehicle.presenter.ts
│       ├── vehicle.module.ts
│       └── README.md
│
├── test/
│   ├── jest-unit.json
│   └── modules/
│       ├── auth/       (3 suites: login, registerOrg, setupOrg)
│       ├── membership/ (1 suite: createMembership)
│       └── driver/     (1 suite: createDriver)

prisma/
├── schema.prisma       # Driver SEM organizationId
├── seed.ts             # Role seeding (ADMIN, DRIVER)
└── migrations/
```

**NOTA: Não existem no projeto (apesar de docs anteriores citarem):**
- ❌ `tenant-context.middleware.ts` — TenantContext é pelo JwtAuthGuard
- ❌ `tenant-aware.repository.ts` — filtro de tenant é manual nos use cases
- ❌ `get-tenant-context.decorator.ts` — consolidado no `@GetUser()`
- ❌ `membership.repository.ts` em shared — está no módulo membership

---

**Fim da Arquitetura Visual** (atualizado 17 Abr 2026)

Para docs de módulo: veja `src/modules/<module>/README.md`
Para documentação técnica: veja `DOCUMENTACAO_TECNICA.md`
Para timeline: veja `ROADMAP.md`
Para progresso: veja `PROGRESS.md`

