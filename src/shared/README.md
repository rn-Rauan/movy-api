# Shared Module

Cross-cutting infrastructure shared by every feature module in the Movy API.
Registered as `@Global()` — no explicit imports required in other modules.

---

## Module Structure

```
shared/
├── shared.module.ts
├── index.ts
├── application/                        # (reserved — currently empty)
├── domain/
│   ├── entities/
│   │   └── role.entity.ts              # Role domain entity
│   │   └── value-objects/
│   │       ├── email.value-object.ts   # Email VO (RFC 5321 validation)
│   │       ├── money.value-object.ts   # Money VO (non-negative, 2 d.p.)
│   │       └── telephone.value-object.ts # Telephone VO (BR format)
│   ├── errors/
│   │   ├── domain.error.ts             # Abstract base for all domain errors
│   │   ├── roles.error.ts              # InsufficientPermissionError, RoleNotFoundError
│   │   └── validation.error.ts         # ValidationError + field-specific subclasses
│   ├── interfaces/
│   │   ├── paginated.response.ts       # PaginatedResponse<T>
│   │   ├── pagination.options.ts       # PaginationOptions
│   │   └── role.repository.ts          # RoleRepository (abstract)
│   └── types/
│       ├── role-name.enum.ts           # RoleName enum (ADMIN | DRIVER)
│       └── status.type.ts             # Status type (ACTIVE | INACTIVE)
├── infrastructure/
│   ├── database/
│   │   ├── prisma.module.ts            # @Global PrismaModule
│   │   ├── prisma.service.ts           # PrismaClient wrapper
│   │   ├── mappers/
│   │   │   └── role.mapper.ts          # Prisma ↔ Role domain
│   │   └── repositories/
│   │       └── prisma-role.repository.ts
│   ├── decorators/
│   │   ├── dev.decorator.ts            # @Dev() — dev-only route marker
│   │   ├── get-tenant-id.decorator.ts  # @GetTenantId() — extract organizationId
│   │   ├── get-user.decorator.ts       # @GetUser() — extract TenantContext
│   │   └── roles.decorator.ts          # @Roles(...) — RBAC annotation
│   ├── guards/
│   │   ├── jwt.guard.ts                # JwtAuthGuard — validates JWT + builds TenantContext
│   │   ├── roles.guard.ts              # RolesGuard — enforces @Roles()
│   │   ├── tenant-filter.guard.ts      # TenantFilterGuard — org isolation
│   │   └── dev.guard.ts               # DevGuard — restricts to isDev=true
│   └── types/
│       ├── jwt-payload.interface.ts    # JwtPayload (req.user type)
│       └── tenant-context.interface.ts # TenantContext (req.context type)
├── presentation/
│   ├── dtos/
│   │   └── paginated.dto.ts            # PaginatedDto<T> — Swagger-annotated envelope
│   ├── exceptions/
│   │   └── all-exceptions.filter.ts   # Global exception → JSON normalizer
│   └── interceptors/
│       ├── logging.interceptor.ts      # Global request/response logger
│       └── tenant-context.interceptor.ts # @deprecated — re-export only
└── providers/
    ├── hash/
    │   └── bcrypt-hash.provider.ts     # BcryptHashProvider (10 rounds)
    └── interfaces/
        └── hash.interface.ts           # HashProvider (abstract)
```

---

## Domain

### Value Objects

| Class | Validates | Key rule |
|---|---|---|
| `Email` | RFC 5321 email format | `create()` throws `InvalidEmailError`; `restore()` skips validation |
| `Money` | Non-negative finite number | Normalised to 2 d.p.; `add()` / `subtract()` return new instances |
| `Telephone` | Brazilian phone format | `(XX) XXXXX-XXXX` or `(XX) XXXX-XXXX` with optional formatting chars |

All value objects are **immutable** — mutation returns a new instance.

### `Role` Entity

Read-only entity representing a user role. Seeded at startup; never created at runtime.

| Property | Type | Notes |
|---|---|---|
| `id` | `number` | Auto-increment PK (from seed) |
| `name` | `RoleName` | `ADMIN` or `DRIVER` |

### Domain Errors

All errors extend `DomainError`. `AllExceptionsFilter` maps `code` suffix to HTTP status:

| Code suffix | HTTP |
|---|---|
| `_NOT_FOUND` | 404 |
| `_ALREADY_EXISTS` | 409 |
| `INVALID_` / `_BAD_REQUEST` | 400 |
| `_FORBIDDEN` | 403 |
| `_UNAUTHORIZED` | 401 |

Shared validation errors:

| Class | Code | Description |
|---|---|---|
| `ValidationError` | `VALIDATION_ERROR` | Base class; carries optional `field` |
| `InvalidEmailError` | `INVALID_EMAIL` | Invalid email format |
| `RequiredFieldError` | `REQUIRED_FIELD` | Missing required field |
| `StringLengthError` | `STRING_LENGTH_ERROR` | Min/max length violation |
| `InvalidTelephoneError` | `INVALID_TELEPHONE` | Invalid BR phone format |
| `InvalidMoneyError` | `INVALID_MONEY` | Negative / NaN / Infinity money value |
| `InsufficientPermissionError` | `INSUFFICIENT_PERMISSION` | User lacks required role |
| `RoleNotFoundError` | `ROLE_NOT_FOUND` | Role lookup failed |

---

## Authentication & Authorization Pipeline

```
HTTP Request
    │
    ▼ JwtAuthGuard
    │  • Passport validates JWT signature
    │  • Builds TenantContext → req.context
    │
    ▼ RolesGuard (if @Roles() present)
    │  • Reads required roles from metadata
    │  • Compares with req.context.role
    │  • isDev → bypass
    │
    ▼ TenantFilterGuard (if applied)
    │  • :organizationId param must match req.context.organizationId
    │  • Rejects B2C users on org-scoped routes
    │  • isDev → bypass
    │
    ▼ DevGuard (if @Dev() present)
    │  • Only users with isDev=true pass
    │
    ▼ Controller
```

### Guard Decorator Cheatsheet

```typescript
// Authenticated + ADMIN only
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Authenticated + ADMIN + tenant-isolated
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard)
@Roles(RoleName.ADMIN)

// Developer-only route
@UseGuards(JwtAuthGuard, DevGuard)
@Dev()
```

### Parameter Decorators

| Decorator | Injects | Throws if |
|---|---|---|
| `@GetUser()` | `TenantContext` from `req.context` | `req.context` is missing |
| `@GetTenantId()` | `organizationId: string` | User is B2C (no org) |

---

## `JwtPayload` vs `TenantContext`

| Field | `JwtPayload` (`req.user`) | `TenantContext` (`req.context`) |
|---|---|---|
| User UUID | `sub` / `id` | `userId` |
| Email | `email` | `email` |
| Org ID | `organizationId?` | `organizationId?` |
| Role | `role?` | `role?` |
| Dev flag | `isDev` | `isDev` |
| User status | `userStatus` | — (not forwarded) |

`req.user` is set by Passport after JWT verification.
`req.context` is built by `JwtAuthGuard` from `req.user` and is what all downstream code should read.

---

## Pagination

### `PaginationOptions`
```typescript
{ page: number; limit: number }   // page is 1-based
```

### `PaginatedResponse<T>`
```typescript
{ data: T[]; total: number; page: number; limit: number; totalPages: number }
```

### `PaginatedDto<T>` (HTTP)
Swagger-annotated class used in controller return types. Constructed by presenters.

---

## Providers

### `HashProvider` / `BcryptHashProvider`

| Method | Description |
|---|---|
| `generateHash(password)` | bcrypt hash with 10 salt rounds |
| `compare(password, hash)` | bcrypt comparison |

Bound in `AuthModule`: `{ provide: HashProvider, useClass: BcryptHashProvider }`.

---

## Database

### `PrismaModule` (`@Global`)
Provides `PrismaService` and `RoleRepository` to the whole application.
Binds `RoleRepository` → `PrismaRoleRepository`.

### `PrismaService`
Extends `PrismaClient` using the `@prisma/adapter-pg` connection pool adapter.
Reads `DATABASE_URL` from the environment — no fallback.

---

## SharedModule Exports

| Export | Used by |
|---|---|
| `JwtAuthGuard` | All authenticated routes |
| `RolesGuard` | Routes with `@Roles()` |
| `TenantFilterGuard` | Organization-scoped routes |
| `DevGuard` | Dev-only routes |
| `BcryptHashProvider` | `AuthModule` |
| `PrismaModule` | All modules (via re-export) |
