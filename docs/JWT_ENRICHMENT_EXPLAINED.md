# 🔐 JWT Enrichment - Visual Explanation

## Sua Pergunta:
> "o jwt vai analizar o tokken tirar o id do user, buscar org, buscar regra dentro da quela org onde entra o isDev? para ser dev tem que ter um email da env? e retorna true? tem algum lugar onde eu consiga vizualizar isso acontecendo?"

**Resposta: Sim!** Logs detalhados mostram tudo.

---

## 1. Fluxo Completo (Agora com Enriquecimento)

### 📝 Você faz REGISTRO/LOGIN:

```
POST /auth/register
ou
POST /auth/login
{
  "email": "john3@example.com",
  "password": "password123"
}
```

### 🔄 Backend processa:

```
┌─────────────────────────────────────────────────────────┐
│ LoginUseCase.execute()                                   │
│ ┌──────────────────────────────────────────────────────┐│
│ │ [Login] Attempt for email: john3@example.com          ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 1️⃣ Valida credenciais                                   │
│ ├─ Busca user no banco                                  │
│ ├─ Compara password com hash                            │
│ └─ ✅ Válido!                                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2️⃣ JwtPayloadService.enrichPayload(userId)              │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ [Enriching JWT Payload] userId=1179a444-42f6-4ca1  ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ STEP A: Busca o User                                    │
│ ├─ SELECT * FROM users WHERE id = '1179a444...'        │
│ ├─ ✅ Encontrou: name='John Doe3', status='ACTIVE'      │
│ └─ [Enriching JWT Payload] FOUND USER                   │
│                                                          │
│ STEP B: Detecta isDev?                                  │
│ ├─ Lê env: DEV_EMAILS=seu.email@movy-local,...          │
│ ├─ Email é 'john3@example.com'                          │
│ ├─ ❌ Não está em DEV_EMAILS                            │
│ └─ [Enriching JWT Payload] isDev=false, email=john...  │
│                                                          │
│ STEP C: Busca Membership (rola na org)                  │
│ ├─ SELECT * FROM user_memberships                       │
│ │  WHERE userId = '1179a444-42f6-4ca1'                  │
│ │    AND removedAt IS NULL                              │
│ │  LIMIT 1                                              │
│ ├─ ✅ Encontrou membership                               │
│ │  organizationId = 'org-789'                           │
│ │  roleId = 'role-123' (ADMIN)                          │
│ ├─ SELECT * FROM roles WHERE id = 'role-123'           │
│ │  name = 'ADMIN'                                       │
│ └─ [Enriching JWT Payload] membership found:            │
│    org=org-789, role=ADMIN                              │
│                                                          │
│ STEP D: Valida coerência                                │
│ ├─ isDev=false && role='ADMIN' && org=org-789           │
│ ├─ ✅ Consistente!                                       │
│ └─ (Se fosse: role sem org → ERRO)                      │
│                                                          │
│ STEP E: Retorna payload ENRIQUECIDO                     │
│ └─ [Enriching JWT Payload] ✅ SUCCESS:                   │
│    sub=1179a444..., org=org-789,                        │
│    role=ADMIN, isDev=false                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3️⃣ Assina JWT com payload enriquecido                   │
│ ├─ jwtService.sign(enrichedPayload)                     │
│ └─ Resultado:                                           │
│                                                          │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                    │
│ .eyJzdWIiOiIxMTc5YTQ0NC00MmY2LTRjYTEtYjI3My00MCJiJ │
│  <base64 do payload enriquecido>                        │
│ .MsJH7bK...KlsH                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4️⃣ Retorna ao cliente                                   │
│ {                                                        │
│   "accessToken": "eyJhbGc...",                          │
│   "refreshToken": "eyJhbGc...",                         │
│   "user": {                                              │
│     "id": "1179a444-42f6-4ca1-b273-40b970a44f37",       │
│     "name": "John Doe3",                                │
│     "email": "john3@example.com"                        │
│   }                                                      │
│ }                                                        │
│                                                          │
│ [Login] ✅ SUCCESS: userId=1179a444...,                │
│ org=org-789, role=ADMIN, isDev=false                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Conteúdo DENTRO do JWT (Base64 Decodificado)

### ❌ ANTES (Simples):
```json
{
  "sub": "1179a444-42f6-4ca1-b273-40b970a44f37",
  "email": "john3@example.com",
  "iat": 1775754039,
  "exp": 1775757639
}
```

### ✅ AGORA (Enriquecido):
```json
{
  "sub": "1179a444-42f6-4ca1-b273-40b970a44f37",
  "id": "1179a444-42f6-4ca1-b273-40b970a44f37",
  "email": "john3@example.com",
  "organizationId": "org-789",        ← NOVO (de membership)
  "role": "ADMIN",                    ← NOVO (role.name)
  "isDev": false,                     ← NOVO (email != DEV_EMAILS)
  "userStatus": "ACTIVE",             ← NOVO (user.status)
  "iat": 1775754039,
  "exp": 1775757639
}
```

---

## 3. Respostas às Suas Perguntas

### ❓ "o jwt vai analisar o token, tirar o id do user..."

```
SIM! Fluxo:

1. JWT chega com "sub": "user-id" ← É extraído daqui
2. UserRepository.findById(userId) ← Busca no banco
3. User encontrado? ✅ Continue ❌ Erro
```

### ❓ "...buscar org, buscar regra dentro daquela org..."

```
SIM! Fluxo:

1. MembershipRepository.findFirstByUserId(userId)
   ↓
   SELECT * FROM user_memberships 
   WHERE userId = ? AND removedAt IS NULL LIMIT 1
   
2. Encontrou membership?
   ├─ SIM: Extrai organizationId + roleId
   └─ NÃO: usuário é B2C (organizationId = undefined)

3. Busca role pelo roleId:
   RoleRepository.findById(roleId)
   ↓
   SELECT * FROM roles WHERE id = ?
   ↓
   role.name = 'ADMIN' ou 'DRIVER'
```

### ❓ "onde entra o isDev?"

```
isDev é INDEPENDENTE de org/role!

Fluxo:

1. Lê DEV_EMAILS da env:
   DEV_EMAILS=seu.email@movy-local,john@example.com,dev@movy.io
   
2. Compara com email do JWT:
   if (DEV_EMAILS.includes(user.email)) {
     isDev = true
   } else {
     isDev = false
   }
   
3. Se isDev=true:
   - Não precisa de organizationId
   - Não precisa de role
   - Pode acessar tudo universalmente
   - Guards reconhecem isDev e passam
```

### ❓ "para ser dev tem que ter um email da env? e retorna true?"

```
EXATO!

DEV_EMAILS é whitelist de emails:

DEV_EMAILS="seu.email@movy-local,john@example.com,dev@movy.io"

if ("john@example.com".includes("seu.email@movy-local")) ✅ isDev=true
if ("john3@example.com".includes(...)) ❌ isDev=false
```

### ❓ "tem algum lugar onde eu consiga vizualizar isso acontecendo?"

```
SIM! LOGS DO SERVIDOR!

Quando você faz login, veja console do servidor:

[14:12:22] ...
[Login] Attempt for email: john3@example.com
[Login] Enriching JWT payload for userId: 1179a444-42f6-4ca1...
[Enriching JWT Payload] userId=1179a444-42f6-4ca1-b273...
[Enriching JWT Payload] isDev=false, email=john3@example.com
[Enriching JWT Payload] membership found: org=org-789, role=ADMIN
[Enriching JWT Payload] ✅ SUCCESS: 
  sub=1179a444..., 
  org=org-789, 
  role=ADMIN, 
  isDev=false
[Login] ✅ SUCCESS: userId=1179a444..., org=org-789, role=ADMIN, isDev=false
```

---

## 4. Passo a Passo Visual

### Login (POST /auth/login):

```
┌─────────────────────────────────────────┐
│ Cliente                                 │
│ {                                       │
│   "email": "john3@example.com",         │
│   "password": "password123"             │
│ }                                       │
└────────────────┬────────────────────────┘
                 │
                 │ POST /auth/login
                 ↓
┌─────────────────────────────────────────┐
│ LoginUseCase                            │
│ 1. Busca user (SELECT...)               │
│ 2. Valida password (bcrypt.compare)     │
│ 3. ✅ Válido!                           │
└────────────────┬────────────────────────┘
                 │
                 │
                 ↓
┌─────────────────────────────────────────┐
│ JwtPayloadService.enrichPayload()       │
│                                         │
│ 1. Busca User no banco                  │
│    ├─ id, email, status...              │
│    └─ ✅ Encontrado                      │
│                                         │
│ 2. Detecta isDev?                       │
│    ├─ Lê DEV_EMAILS                     │
│    ├─ Compara com email                 │
│    └─ isDev = false                     │
│                                         │
│ 3. Busca Membership                     │
│    ├─ Consulta user_memberships         │
│    ├─ organizationId = "org-789"        │
│    ├─ roleId = "role-456"               │
│    └─ ✅ Encontrado                      │
│                                         │
│ 4. Busca Role                           │
│    ├─ Consulta roles                    │
│    ├─ name = "ADMIN"                    │
│    └─ ✅ Encontrado                      │
│                                         │
│ 5. Retorna payload ENRIQUECIDO:         │
│    {                                    │
│      sub: "user-id",                    │
│      email: "john3@...",                │
│      organizationId: "org-789",         │
│      role: "ADMIN",                     │
│      isDev: false,                      │
│      userStatus: "ACTIVE"               │
│    }                                    │
└────────────────┬────────────────────────┘
                 │
                 │ Payload Enriquecido
                 ↓
┌─────────────────────────────────────────┐
│ JwtService.sign(payload)                │
│ ├─ Secret: JWT_SECRET (env)             │
│ ├─ Expiração: 1h                        │
│ └─ JWT assinado ✅                      │
└────────────────┬────────────────────────┘
                 │
                 │ JWT Token
                 ↓
┌─────────────────────────────────────────┐
│ Cliente                                 │
│ {                                       │
│   "accessToken": "eyJhb...",            │
│   "refreshToken": "eyJhb...",           │
│   "user": { ... }                       │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## 5. Próximas Requisições (com JWT Enriquecido)

### GET /users/me (com novo accessToken):

```
┌──────────────────────────────┐
│ Cliente                      │
│ GET /users/me                │
│ Authorization: Bearer JWT... │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ JwtAuthGuard                 │
│ ├─ Valida JWT                │
│ ├─ req.user = payload        │
│ └─ ✅ Válido                  │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ TenantContextInterceptor     │
│ ├─ Extrai req.user           │
│ ├─ Cria TenantContext        │
│ ├─ req.context = {           │
│ │    userId: "...",          │
│ │    email: "john3@...",     │
│ │    organizationId: "org",  │
│ │    role: "ADMIN",          │
│ │    isDev: false            │
│ │  }                         │
│ └─ ✅ Injetado               │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ UserController.getMe()       │
│ @GetTenantContext() context  │
│ ├─ context.userId = "..."    │
│ ├─ Busca user no banco       │
│ └─ Retorna perfil ✅         │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Cliente                      │
│ {                            │
│   "id": "1179a4...",         │
│   "name": "John Doe3",       │
│   "email": "john3@...",      │
│   "status": "ACTIVE"         │
│ }                            │
└──────────────────────────────┘
```

---

## 6. Cenários Diferentes

### 📱 Cenário 1: Usuário B2C (sem organização)

```
Usuário se registra SEM organização:

Login User:
├─ id: "user-123"
├─ email: "user@personal.com"
└─ Sem membership

JWT Payload:
{
  sub: "user-123",
  email: "user@personal.com",
  organizationId: undefined,     ← Sem org!
  role: undefined,               ← Sem role!
  isDev: false
}

Pode fazer:
✅ GET /users/me (seu perfil)
✅ PUT /users/me (atualizar perfil)

Não pode fazer:
❌ GET /organizations/:id/vehicles (TenantFilterGuard bloqueia)
```

### 👔 Cenário 2: Usuário Admin (com organização)

```
Usuário é ADMIN da org-789:

Login User:
├─ id: "user-456"
├─ email: "admin@company.com"
├─ Membership:
│  ├─ organizationId: "org-789"
│  └─ role: "ADMIN"
└─ Não é dev

JWT Payload:
{
  sub: "user-456",
  email: "admin@company.com",
  organizationId: "org-789",    ← Tem org!
  role: "ADMIN",                 ← Tem role!
  isDev: false
}

Pode fazer:
✅ GET /users/me
✅ GET /organizations/org-789/vehicles (TenantFilterGuard passa)
✅ POST /organizations/org-789/vehicles (RolesGuard passa)
```

### 🔑 Cenário 3: Usuário Developer (Super User)

```
Email está em DEV_EMAILS:
DEV_EMAILS=dev@movy.io

Login User:
├─ id: "user-dev"
├─ email: "dev@movy.io"        ← EM DEV_EMAILS!
├─ Sem membership ou tem
└─ isDev detectado!

JWT Payload:
{
  sub: "user-dev",
  email: "dev@movy.io",
  organizationId: undefined,    ← Irrelevante para dev
  role: undefined,              ← Irrelevante para dev
  isDev: true                   ← SUPER USER!
}

Pode fazer:
✅ GET /organizations/ANY-ORG/vehicles (isDev bypass)
✅ DELETE /organizations/any-id (isDev=true bloqueia nada)
✅ POST /users/any-id (isDev salta todos guards)
✅ Efetivamente: admin de tudo
```

---

## 7. Como Ver os Logs

### No Terminal (npm run start:dev):

```
[14:12:22] Starting compilation in watch mode...
[14:12:25] Found 0 errors. Watching for file changes.
[Nest] 12345  - 09/04/2026, 14:12:30  LOG   [NestFactory] Starting Nest application...

[Login] Attempt for email: john3@example.com
[Enriching JWT Payload] userId=1179a444-42f6-4ca1-b273-40b970a44f37
[Enriching JWT Payload] isDev=false, email=john3@example.com
[Enriching JWT Payload] membership found: org=org-789, role=ADMIN
[Enriching JWT Payload] ✅ SUCCESS: sub=1179a444-42f6-4ca1, org=org-789, role=ADMIN, isDev=false
[Login] ✅ SUCCESS: userId=1179a444-42f6-4ca1, org=org-789, role=ADMIN, isDev=false

[TenantContext] userId=1179a444-42f6-4ca1, org=org-789, role=ADMIN, isDev=false
```

### Como Testar:

1. **Fazer Login:**
   ```bash
   curl -X POST http://localhost:5701/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "john3@example.com", "password": "password123"}'
   ```

2. **Ver Logs no console (terminal com npm run start:dev)**
   - Procure por `[Login]` e `[Enriching JWT Payload]`

3. **Copiar accessToken**

4. **Testar GET /users/me:**
   ```bash
   curl http://localhost:5701/users/me \
     -H "Authorization: Bearer <TOKEN_COPIADO>"
   ```

5. **Ver mais logs:**
   - `[TenantContext]` mostra contexto extraído

---

## RESUMO:

> ✅ JWT é ENRIQUECIDO com:
> - `organizationId` (buscado da membership)
> - `role` (buscado da role naquela org)
> - `isDev` (comparado com DEV_EMAILS)
> - `userStatus` (do user.status)
>
> ✅ Tudo é registrado em LOGS detalhados
>
> ✅ Processo ocorre em `JwtPayloadService.enrichPayload()`
>
> ✅ Usado por: LoginUseCase + RefreshTokenUseCase
