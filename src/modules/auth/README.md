# Auth Module

Handles all authentication and JWT lifecycle for the Movy API.
Implements stateless JWT auth with enriched payloads containing multi-tenant
(`organizationId`) and RBAC (`role`, `isDev`) context. No DB query on every
request — context is embedded at login/refresh time.

---

## JWT Payload (`JwtPayload`)

| Field | Type | Notes |
|---|---|---|
| `sub` | `string` | User UUID (standard JWT subject) |
| `id` | `string` | Same as `sub` — convenience alias |
| `email` | `string` | User email |
| `organizationId` | `string \| undefined` | First active membership org; `undefined` for B2C users |
| `role` | `'ADMIN' \| 'DRIVER' \| null` | Role in `organizationId`; `null` for B2C/dev users |
| `isDev` | `boolean` | `true` when email is in `DEV_EMAILS` env var |
| `userStatus` | `string` | `'ACTIVE' \| 'INACTIVE'` |

Access token expiry: **1 h**. Refresh token expiry: **7 d**.

---

## API Endpoints

| Method | Path | Guard | Use Case |
|---|---|---|---|
| `POST` | `/auth/login` | — | `LoginUseCase` |
| `POST` | `/auth/register` | — | `RegisterUseCase` |
| `POST` | `/auth/register-organization` | — | `RegisterOrganizationWithAdminUseCase` |
| `POST` | `/auth/setup-organization` | `JwtAuthGuard` | `SetupOrganizationForExistingUserUseCase` |
| `POST` | `/auth/refresh` | — | `RefreshTokenUseCase` |

---

## Use Cases

| Class | Description |
|---|---|
| `LoginUseCase` | Validates email/password, enriches JWT payload, returns token pair |
| `RegisterUseCase` | Creates user, then delegates to `LoginUseCase` for auto-login |
| `RefreshTokenUseCase` | Verifies refresh token, re-enriches payload, rotates both tokens |
| `RegisterOrganizationWithAdminUseCase` | Atomically creates user + org + `ADMIN` membership; compensates on failure |
| `SetupOrganizationForExistingUserUseCase` | Creates org for authenticated user, links as `ADMIN`, re-issues JWT |

---

## Key Services & Infrastructure

### `JwtPayloadService`
Single source of truth for JWT enrichment. Called by all use cases that issue tokens:
1. Load user by UUID
2. Detect `isDev` via `DEV_EMAILS` env
3. Query first active membership for `organizationId` + `role` (skipped for dev users)
4. Build and return the signed `JwtPayload`

### `JwtStrategy`
Passport strategy registered as `'jwt'`. Reads the bearer token from `Authorization` header,
verifies signature against `JWT_SECRET`, and returns the decoded payload as `req.user`.
**No DB queries** — trusts the signed payload.

---

## Compensation Flows

`RegisterOrganizationWithAdminUseCase` implements a best-effort saga:
- Organization creation fails → delete the newly created user
- Membership creation fails → delete the newly created user

`SetupOrganizationForExistingUserUseCase` does NOT compensate the organization on
membership failure — manual cleanup is required if that happens.

---

## Module Structure

```
src/modules/auth/
├── auth.module.ts
├── application/
│   ├── dtos/
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── register.dto.ts
│   │   ├── register-organization.dto.ts
│   │   ├── setup-organization.dto.ts
│   │   └── token-response.dto.ts
│   ├── services/
│   │   └── jwt-payload.service.ts       # JWT enrichment
│   └── use-cases/
│       ├── login.use-case.ts
│       ├── refresh-token.use-case.ts
│       ├── register.use-case.ts
│       ├── register-organization-with-admin.use-case.ts
│       └── setup-organization-for-existing-user.use-case.ts
├── infrastructure/
│   └── jwt.strategy.ts                  # Passport JWT strategy
└── presentation/
    └── controllers/
        └── auth.controller.ts
```

---

## Module Dependencies

**Imports:** `UserModule`, `MembershipModule`, `forwardRef(() => OrganizationModule)`,
`PrismaModule`, `SharedModule`, `PassportModule`, `JwtModule` (async from `JWT_SECRET`)

**Providers:** All 5 use cases + `JwtPayloadService` + `JwtStrategy` + `BcryptHashProvider`

**Exports:** `JwtStrategy`, `PassportModule`, `JwtModule`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Secret used to sign/verify JWTs — throws on startup if missing |
| `DEV_EMAILS` | ❌ | Comma-separated list of developer emails that bypass org/role checks |

---

## Known Limitations

### Multi-org switching não implementado (ADR-018)

O JWT carrega **uma única `organizationId`** por sessão — a primeira membership ativa do usuário ordenada por `assignedAt ASC` (`findFirstActiveByUserId`).

**Impacto:** um admin com 2+ organizações não consegue acessar as orgs secundárias via API. O `TenantFilterGuard` rejeita com 403 qualquer rota cujo `:organizationId` não bata com o do token.

**Workaround atual:** nenhum (a não ser manipulação manual via `@Dev()`).

**Solução planejada:** `POST /auth/switch-organization` — recebe a org destino, valida membership ativa, emite novo par de tokens com o contexto correto e rotaciona o refresh token. Detalhes no ADR-018 e no plano de implementação.
