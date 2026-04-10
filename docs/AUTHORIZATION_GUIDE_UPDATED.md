# 🔐 Documentação Atualizada - Multi-tenant RBAC (Fase 1)

## 1. Arquitetura de Segurança

### 1.1 Fluxo de Autenticação (JWT Enriquecido)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente faz LOGIN (email + password)                      │
└─────────────────────────────────────────────────┬───────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │ AuthController             │
                                    │ POST /auth/login           │
                                    └─────────────┬─────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │ JwtStrategy.validate()     │
                                    │ - Busca User                │
                                    │ - Detecta isDev (email)    │
                                    │ - Busca Membership         │
                                    │ - Extrai role + org        │
                                    └─────────────┬─────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │ JWT ENRIQUECIDO            │
                                    │ {                          │
                                    │   sub: userId,             │
                                    │   email,                   │
                                    │   organizationId,  ← NOVO │
                                    │   role: 'ADMIN',   ← NOVO │
                                    │   isDev: false,    ← NOVO │
                                    │   userStatus       ← NOVO │
                                    │ }                          │
                                    └─────────────┬─────────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │ Retorna ao cliente         │
                                    │ { access_token: "..." }    │
                                    └─────────────────────────────┘
```

### 1.2 Fluxo de Requisição Autenticada

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente faz GET /users/me                                    │
│ Header: Authorization: Bearer <JWT_ENRIQUECIDO>              │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │ JwtAuthGuard               │
                        │ - Valida assinatura JWT    │
                        │ - Popula req.user          │
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │ TenantContextInterceptor   │
                        │ - Extrai JWT payload       │
                        │ - Cria TenantContext       │
                        │ - Injecta em req.context   │
                        │ - Valida coerência         │
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │ UserController.getMe()     │
                        │ @GetTenantContext()        │
                        └─────────────┬──────────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │ Retorna seu perfil         │
                        │ { id, name, email, ... }   │
                        └─────────────────────────────┘
```

---

## 2. Interfaces e Tipos

### 2.1 JwtPayload (do JWT Strategy)

```typescript
interface JwtPayload {
  sub: string;                    // User ID (JWT standard)
  id: string;                     // User ID (alias)
  email: string;
  organizationId?: string;        // undefined = B2C user ou dev
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;                 // Detectado da whitelist DEV_EMAILS
  userStatus: string;             // 'ACTIVE' | 'INACTIVE'
}
```

### 2.2 TenantContext (do Interceptor)

```typescript
interface TenantContext {
  userId: string;                 // Sempre presente
  email: string;                  // Sempre presente
  organizationId?: string;        // undefined para B2C ou dev
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;                 // false = usuário normal, true = dev
}
```

---

## 3. Decoradores Disponíveis

### 3.1 @GetTenantContext()

Extrai o **contexto completo** de tenancy de uma requisição.

**Uso:**
```typescript
@Get('me')
async getMe(@GetTenantContext() context: TenantContext) {
  // context.userId = JWT userId
  // context.email = JWT email
  // context.organizationId = organização (ou undefined)
  // context.role = role na organização
  // context.isDev = é desenvolvedor?
}
```

**Lança:** `BadRequestException` se middleware/interceptor não foi executado.

---

### 3.2 @GetTenantId()

Extrai **apenas organizationId** com proteção contra B2C users.

**Uso:**
```typescript
@Get('organizations/:organizationId/vehicles')
async listVehicles(@GetTenantId() tenantId: string) {
  // tenantId = organizationId garantido
  // B2C users recebem ForbiddenException
  // Developers sempre passam
}
```

**Lança:** `ForbiddenException` se user não tem organizationId (B2C).

---

## 4. Guards (Proteção)

### 4.1 JwtAuthGuard

Valida JWT e popula `req.user`.

```typescript
@UseGuards(JwtAuthGuard)
@Get('users/me')
async getMe() { }
```

---

### 4.2 TenantFilterGuard

Valida que `organizationId` da URL matches JWT `organizationId`.

```typescript
@UseGuards(JwtAuthGuard, TenantFilterGuard)
@Get('organizations/:organizationId/vehicles')
async listVehicles(
  @Param('organizationId') orgId: string,
  @GetTenantId() tenantId: string,  // Garantido ser igual a orgId
) { }
```

**Proteção:**
- ✅ Developers (`isDev=true`) bypass tudo
- ✅ Valida OrgId match (IDOR protection)
- ✅ Bloqueia B2C users em endpoints org-scoped

---

### 4.3 RolesGuard

Valida `@Roles()` contra `context.role`.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('organizations/:organizationId/settings')
async getSettings() { }
```

**Proteção:**
- ✅ Developers sempre passam
- ✅ Compara role do contexto
- ✅ Lança `ForbiddenException` se role não autorizada

---

## 5. Endpoints Seguro (Padrão /me)

### 5.1 User Endpoints

| Endpoint | Método | Padrão | Segurança |
|----------|--------|--------|-----------|
| `/users/me` | GET | ✅ Novo | Seu próprio perfil |
| `/users/me` | PUT | ✅ Novo | Editar seu perfil |
| `/users/me` | DELETE | ✅ Novo | Desabilitar sua conta |
| `/users/:id` | GET | ❌ Deprecated | Use /me |
| `/users/:id` | PUT | ❌ Removed | Use /me |
| `/users/:id` | DELETE | ❌ Removed | Use /me |

---

## 6. Variáveis de Ambiente

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=3600                      # 1 hora
JWT_REFRESH_EXPIRATION=604800            # 7 dias

# Developer Whitelist
DEV_EMAILS=seu.email@movy-local,dev@movy.io
```

---

## 7. Cenários de Teste

### 7.1 Usuário B2C (sem organização)

```typescript
// JWT gerado
{
  sub: "user-123",
  email: "b2c@example.com",
  organizationId: undefined,      // Sem org
  role: undefined,                 // Sem role
  isDev: false
}

// Pode acessar:
GET /users/me               ✅ Seu próprio perfil

// Não pode acessar:
GET /organizations/:id      ❌ ForbiddenException
GET /orgs/:id/vehicles      ❌ TenantFilterGuard bloqueia
DELETE /users/me            ✅ Pode desabilitar a si mesmo
```

### 7.2 Usuário Org (com organização)

```typescript
// JWT gerado
{
  sub: "user-456",
  email: "admin@company.com",
  organizationId: "org-789",      // Membros de org-789
  role: "ADMIN",                  // Admin dessa org
  isDev: false
}

// Pode acessar:
GET /users/me               ✅ Seu cabeça
GET /orgs/org-789/vehicles  ✅ Veículos da sua org
PUT /orgs/org-789/vehicles  ✅ Editar (ADMIN role)

// Não pode acessar:
GET /orgs/other-org/vehicles  ❌ TenantFilterGuard bloqueia
GET /orgs/org-789/settings    ❌ RolesGuard bloqueia (requer role específico)
PUT /orgs/org-789/users       ❌ RolesGuard bloqueia
```

### 7.3 Usuário Developer

```typescript
// JWT gerado (email em DEV_EMAILS)
{
  sub: "user-dev",
  email: "dev@movy.io",           // Em DEV_EMAILS
  organizationId: undefined,      // Dev não precisa de org
  role: undefined,
  isDev: true                     // ← FLAG ESPECIAL
}

// Pode acessar:
GET /orgs/**/anything           ✅ Todos os guards passam
POST /organizations             ✅ Criar orgs
DELETE /orgs/any-org            ✅ Deletar qualquer coisa
PUT /users/*/role               ✅ Modificar qualquer user

// Proteção igual mesmo assim:
- JWT ainda precisa ser válido
- Middleware ainda cria TenantContext
- Guards reconhecem isDev=true e permite acesso
```

---

## 8. Fluxo de Erro (500 anterior vs agora)

### ❌ ANTES:
```json
{
  "statusCode": 500,
  "message": "TenantContext not found in request. Ensure TenantContextMiddleware is registered.",
  "path": "/users/me"
}
```

**Causa:** Middleware executava ANTES do JwtAuthGuard.

### ✅ AGORA:
1. **Sem Authorization header:**
   ```json
   { "statusCode": 401, "message": "Unauthorized" }
   ```

2. **Com JWT inválido:**
   ```json
   { "statusCode": 401, "message": "Invalid token" }
   ```

3. **Com JWT válido:**
   ```json
   { "statusCode": 200, "data": { "id": "...", "email": "..." } }
   ```

---

## 9. Próximos Passos (PASSO 9+)

- [ ] Criar Vehicle Controller com multi-tenant isolation
- [ ] Criar Trip Controller com multi-role support
- [ ] Prisma Migrations (add organizationId fields)
- [ ] E2E Tests (IDOR protection validation)
- [ ] Refactor Organization Controller com guards
- [ ] Refactor Membership Controller com proper validation
