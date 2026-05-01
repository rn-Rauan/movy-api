# Segurança — Movy API

> Modelo de segurança do sistema: autenticação, autorização, isolamento de tenant e proteções implementadas.

---

## 1. Autenticação (JWT)

### 1.1 Tokens

O sistema utiliza dois tokens JWT distintos:

| Token | Expiração padrão | Conteúdo |
|---|---|---|
| **Access Token** | 1 hora (`JWT_EXPIRATION`) | `sub`, `id`, `email`, `organizationId`, `role`, `isDev`, `userStatus` |
| **Refresh Token** | 7 dias (`JWT_REFRESH_EXPIRATION`) | Todos os campos do access token + **`jti`** (UUID único) |

O `jti` (JWT ID) do refresh token é persistido na tabela `refresh_tokens`. Isso permite revogar sessões sem invalidar o token criptograficamente.

### 1.2 Payload Enriquecido

O payload JWT é enriquecido no momento do login — a strategy **não faz query ao banco por request**. Isso evita uma consulta por request autenticado:

```json
{
  "sub": "user-uuid",
  "id": "user-uuid",
  "email": "admin@empresa.com",
  "organizationId": "org-uuid",
  "role": "ADMIN",
  "isDev": false,
  "userStatus": "ACTIVE",
  "iat": 1714000000,
  "exp": 1714003600,
  "aud": "movy-api",
  "iss": "movy-auth"
}
```

### 1.3 Ciclo de Vida dos Tokens

```
POST /auth/login
  ├── Valida email + senha (bcrypt)
  ├── Gera accessToken (sem jti)
  ├── Gera jti = randomUUID()
  ├── Gera refreshToken (com jti)
  └── Persiste jti em refresh_tokens (com expiresAt)

POST /auth/refresh
  ├── Verifica assinatura JWT do refreshToken
  ├── Verifica expiração
  ├── Busca jti em refresh_tokens → 401 se ausente (token revogado)
  ├── Busca usuário no banco → 401 se inativo
  ├── Apaga jti antigo (rotação de token)
  ├── Gera novo par de tokens com novo jti
  └── Persiste novo jti

POST /auth/logout
  ├── Verifica assinatura JWT (se inválido → no-op, idempotente)
  └── Apaga jti de refresh_tokens (revoga sessão)
```

### 1.4 Rotação de Refresh Token

Cada uso de um refresh token gera um **novo par de tokens** e invalida o anterior. Isso significa:
- Roubo de refresh token é detectável: se o token legítimo tentar usar um jti já consumido, o sistema rejeita
- Não existe logout global automático — apenas o jti específico da sessão é revogado

### 1.5 Trade-offs Conhecidos

| Decisão | Motivo |
|---|---|
| Access token não é revogável | Tokens stateless de curta duração (1h) — padrão da indústria |
| Refresh token revogável via JTI | Permite logout real e detecção de roubo |
| Sem query ao banco no JwtAuthGuard | Performance — elimina 1 SQL por request autenticado |

---

## 2. Autorização (RBAC)

### 2.1 Roles

| Role | Quem é | Acesso |
|---|---|---|
| `ADMIN` | Administrador de uma organização | Gerencia frota, drivers, viagens e memberships da sua org |
| `DRIVER` | Motorista vinculado a uma org | Acessa suas viagens, pode confirmar presença de passageiros |
| *(sem role)* | Usuário B2C | Acessa apenas seus próprios dados + viagens públicas |
| `isDev: true` | Email listado em `DEV_EMAILS` | Bypassa todos os checks de role e tenant |

### 2.2 Guards e Decorators

```typescript
// Requer autenticação (presente em quase toda rota)
@UseGuards(JwtAuthGuard)

// Requer role específica
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Requer autenticação + role + :organizationId no path deve bater com o JWT
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Rota exclusiva para devs (env DEV_EMAILS)
@UseGuards(JwtAuthGuard, DevGuard)
@Dev()
```

### 2.3 TenantFilterGuard

Quando a rota contém `:organizationId` (ou `:orgId`) no path, o guard compara o parâmetro com o `organizationId` do JWT:

```
GET /organizations/org-A/vehicles  com JWT orgId=org-B
  → TenantFilterGuard → 403 Forbidden  (bloqueado antes de chegar ao use case)
```

Usuários B2C (sem `organizationId` no JWT) recebem 403 em qualquer rota que exija org.

### 2.4 Dev Bypass

Emails listados em `DEV_EMAILS` (env var, separados por vírgula) recebem `isDev: true` no JWT. Esses usuários:
- Ignoram `RolesGuard`
- Ignoram `TenantFilterGuard`
- Passam pelo `DevGuard`
- Podem acessar recursos de qualquer organização

**Nunca configure `DEV_EMAILS` em produção com emails reais de usuários.**

---

## 3. Proteção IDOR (Insecure Direct Object Reference)

IDOR é o vetor mais crítico em APIs multi-tenant: um atacante usa um ID de recurso de outro tenant para acessar dados alheios.

### 3.1 Rotas com `:organizationId` no path

**Proteção:** `TenantFilterGuard` bloqueia antes de chegar ao banco.

```
GET /vehicles/organization/:organizationId
  → Guard compara :organizationId com JWT → bloqueia se divergir
```

### 3.2 Rotas com apenas `:id` (sem orgId no path)

**Proteção:** Use case valida ownership após buscar a entidade.

**Veículos** (FK direta):
```typescript
const vehicle = await this.vehicleRepository.findById(id);
if (!vehicle || vehicle.organizationId !== organizationId) {
  throw new VehicleAccessForbiddenError();
}
```

**Drivers** (sem FK direta — vinculados via membership):
```typescript
const belongs = await this.driverRepository.belongsToOrganization(driverId, organizationId);
if (!belongs) throw new DriverAccessForbiddenError();
```

### 3.3 Regra geral de queries

Queries de entidades tenant-scoped devem sempre incluir `organizationId` como filtro:

```typescript
// ❌ NUNCA
prisma.vehicle.findUnique({ where: { id } })

// ✅ SEMPRE
prisma.vehicle.findFirst({ where: { id, organizationId } })
```

---

## 4. Isolamento Multi-Tenant

O `organizationId` **nunca** vem do body de uma request — sempre do JWT (`req.context.organizationId`). Isso elimina o vetor onde um ator mal-intencionado pode forjar um `organizationId` diferente.

```typescript
// ❌ VULNERÁVEL — organizationId vem do body
@Body() dto: CreateVehicleDto  // { ..., organizationId: "org-de-outro" }

// ✅ SEGURO — organizationId vem do JWT
@GetTenantId() organizationId: string  // decorator lê req.context.organizationId
```

**Exemplos aplicados:**
- `POST /memberships` — `organizationId` vem do JWT, não do body
- `POST /vehicles` — `organizationId` injetado do context no use case
- `POST /trips` — `organizationId` injetado do context no use case

---

## 5. Rate Limiting

Rate limiting global via `@nestjs/throttler`:

| Configuração | Valor padrão |
|---|---|
| Janela de tempo | 60 segundos |
| Máximo de requests | 60 requests/janela |
| Escopo | Por IP |

Todos os endpoints herdam o limite global. Endpoints de autenticação estão sujeitos ao mesmo limite (não há throttle diferenciado por endpoint atualmente).

---

## 6. Senhas

- Hash: **bcrypt** com 10 salt rounds
- `passwordHash` nunca é retornado em nenhuma resposta HTTP
- O presenter (`UserPresenter.toHTTP`) serializa explicitamente apenas os campos necessários — sem risco de leak por acidente

---

## 7. Soft Delete e Integridade

- **Usuários:** `status = INACTIVE` (soft delete)
- **Organizações:** `status = INACTIVE`
- **Memberships:** `removedAt = timestamp`
- **Drivers/Vehicles:** `status = INACTIVE` ou `SUSPENDED`

Entidades com histórico financeiro (`TripInstance`, `Driver`, `Vehicle`) usam `onDelete: Restrict` nas foreign keys para impedir exclusão de registros referenciados por viagens com histórico financeiro.

---

## 8. Variáveis de Ambiente Sensíveis

| Variável | Obrigatória | Notas de Segurança |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string completa com credenciais — nunca commitar |
| `JWT_SECRET` | ✅ | Chave de assinatura JWT — mínimo 32 caracteres aleatórios em prod |
| `DEV_EMAILS` | ❌ | **Nunca popular em produção** — bypassa toda autorização |
| `JWT_EXPIRATION` | ❌ | Padrão 3600s (1h) |
| `JWT_REFRESH_EXPIRATION` | ❌ | Padrão 604800s (7d) |

O sistema **lança exceção no startup** se `JWT_SECRET` não estiver definida.

---

## 9. Headers e Protocolos

- Todos os endpoints protegidos exigem `Authorization: Bearer <token>`
- O token é validado pelo `JwtAuthGuard` antes de qualquer lógica de negócio
- O `JwtAuthGuard` popula `req.context` com `TenantContext` — controllers e use cases leem daqui, nunca de `req.user` diretamente

```typescript
interface TenantContext {
  userId: string;
  email: string;
  organizationId: string | null;
  role: RoleName | null;
  isDev: boolean;
}
```
