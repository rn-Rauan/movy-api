# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movy API is a multi-tenant SaaS backend for collective transport management. Built with NestJS 11, TypeScript (strict), Prisma 7, and PostgreSQL 17. Architecture follows **Clean Architecture + DDD Lite** per module.

## Commands

```bash
# Development
npm run start:dev         # Watch mode, port 3001
npm run start:debug       # Debug + watch mode

# Build & Type checking
npm run build             # Compile TypeScript via NestJS CLI
npx tsc --noEmit          # Type-check without emitting

# Linting & Formatting
npm run lint              # ESLint + Prettier fix
npm run format            # Prettier write on src/ and test/

# Tests
npx jest --config test/jest-unit.json          # Unit tests (use this, not npm test)
npx jest --config test/jest-unit.json --watch  # Unit tests in watch mode
npx jest --config test/jest-unit.json <path>   # Single spec file
npm run test:e2e                               # E2E tests

# Database
docker-compose up postgres              # Start only PostgreSQL (port 5705)
docker-compose up --build               # Full stack (API on port 5700, DB on 5705)
npx prisma migrate dev                  # Run migrations (dev)
npx prisma migrate deploy               # Run migrations (prod/CI)
npm run db:seed                         # Seed roles (ADMIN, DRIVER) via tsx
npx prisma studio                       # GUI for the database
```

> **Note:** `npm test` uses the root Jest config which has no `moduleNameMapper` for `src/` aliases — always use `jest-unit.json` for unit tests.

## Architecture

Each feature module follows this structure:

```
src/modules/<module>/
├── application/
│   ├── dtos/           # Input/output DTOs (class-validator)
│   └── use-cases/      # Application logic (one class per use case)
├── domain/
│   ├── entities/       # Domain entities + value objects + entity-specific errors
│   ├── errors/         # Module-level domain errors
│   └── interfaces/     # Repository abstractions
├── infrastructure/
│   └── db/
│       ├── mappers/    # Prisma row ↔ domain entity conversion
│       └── repositories/
└── presentation/
    ├── controllers/
    └── mappers/        # Domain entity → HTTP response (toHTTP)
```

### Shared Module (`src/shared/`)

Registered as `@Global()` — no explicit imports needed. Provides:
- **Guards:** `JwtAuthGuard`, `RolesGuard`, `TenantFilterGuard`, `DevGuard`
- **Decorators:** `@Roles()`, `@Dev()`, `@GetUser()`, `@GetTenantId()`
- **Value Objects:** `Email`, `Money`, `Telephone` (all immutable, `create()` throws, `restore()` skips validation)
- **PrismaService:** extends PrismaClient via `@prisma/adapter-pg`; reads `DATABASE_URL`, no fallback
- **BcryptHashProvider:** 10 salt rounds

### Auth & Authorization Pipeline

```
Request
  → JwtAuthGuard      (validates JWT; builds TenantContext → req.context)
  → RolesGuard        (enforces @Roles(); isDev bypasses)
  → TenantFilterGuard (:organizationId param must match req.context.organizationId; isDev bypasses)
  → DevGuard          (only isDev=true passes)
  → Controller
```

JWT payload is enriched at login/refresh (no DB query on each request). `req.user` = raw JWT payload; `req.context` = `TenantContext` (what controllers should read).

Guard combos:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard) @Roles(RoleName.ADMIN)
@UseGuards(JwtAuthGuard, TenantFilterGuard, RolesGuard) @Roles(RoleName.ADMIN)
@UseGuards(JwtAuthGuard, DevGuard) @Dev()
```

### Domain Error → HTTP Mapping

`AllExceptionsFilter` (global) maps `DomainError.code` suffix to HTTP status:

| Code suffix | HTTP |
|---|---|
| `_NOT_FOUND` | 404 |
| `_ALREADY_EXISTS` | 409 |
| `INVALID_` / `_BAD_REQUEST` | 400 |
| `_FORBIDDEN` | 403 |
| `_UNAUTHORIZED` | 401 |

New domain errors must extend `DomainError` and use a code that follows this convention. Shared validation errors live in `src/shared/domain/errors/`; module-specific errors live in `src/modules/<module>/domain/errors/`.

## Test Patterns

Tests live in `test/modules/<module>/application/use-cases/`. Pattern: `makeMocks()` + `setupHappyPath()` + `sut` + AAA (Arrange-Act-Assert), with per-module factories for domain entities.

```typescript
function makeMocks() { /* jest.fn() per dependency */ }
function setupHappyPath(mocks, entity) { /* wire happy-path return values */ }

describe('SomeUseCase', () => {
  let sut: SomeUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new SomeUseCase(mocks.dep1, mocks.dep2);
  });
});
```

Factories are in `test/modules/<module>/factories/`. Use `make<Entity>()` helpers to build domain objects.

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Throws on startup if missing |
| `PORT` | ❌ | Defaults to 3001 |
| `JWT_EXPIRATION` | ❌ | Seconds; default 3600 (1h) |
| `JWT_REFRESH_EXPIRATION` | ❌ | Seconds; default 604800 (7d) |
| `DEV_EMAILS` | ❌ | Comma-separated emails; bypass org/role checks |

## Plan Limits Enforcement

`PlanLimitService` (in `SubscriptionsModule`) centralizes plan limit checks. Inject it into any use case that needs to gate resource creation behind plan quotas.

```typescript
// Pattern for create use cases:
const count = await this.repository.countActiveByOrganizationId(organizationId);
await this.planLimitService.assertXLimit(organizationId, count);
// then save...
```

Methods: `assertVehicleLimit`, `assertDriverLimit`, `assertMonthlyTripLimit`. Each throws a `_FORBIDDEN`-coded error on breach → HTTP 403.

- `NoActiveSubscriptionError` (`NO_ACTIVE_SUBSCRIPTION_FORBIDDEN`) — org has no active subscription
- `VehicleLimitExceededError` (`VEHICLE_PLAN_LIMIT_FORBIDDEN`), `DriverLimitExceededError` (`DRIVER_PLAN_LIMIT_FORBIDDEN`), `MonthlyTripLimitExceededError` (`MONTHLY_TRIP_PLAN_LIMIT_FORBIDDEN`)

Any module that injects `PlanLimitService` must import `SubscriptionsModule`.

`resolveActiveSubscription(orgId, repo)` (`src/modules/subscriptions/application/utils/`) handles lazy expiration — subscription is expired on-demand when read, not by cron. Used internally by `PlanLimitService` and `FindActiveSubscriptionUseCase`.

## Payment Simulation

Payments are confirmed/failed via `PATCH /organizations/:orgId/payments/:id/confirm` and `.../fail`. Both require `ADMIN + TenantFilter`. Only `PENDING` payments can be processed (`PaymentAlreadyProcessedError` otherwise).

## Key Conventions

- **Multi-tenancy:** all org-scoped operations validate `organizationId` from `TenantContext`, never from user input directly.
- **Soft deletes:** organizations → `status = INACTIVE`; memberships → `removedAt` timestamp; users → `status = INACTIVE`.
- **Prisma client:** generated to `generated/prisma/` (not the default location) with `moduleFormat = "cjs"`.
- **Path aliases:** `src/` and `generated/` are aliased in `tsconfig.json` and `jest-unit.json`; use `src/modules/...` imports.
- **Swagger:** available at `/api` in dev.
- **Auto-subscription:** `RegisterOrganizationWithAdminUseCase` auto-subscribes new orgs to the FREE plan after the main transaction. Requires `db:seed` to have run first (FREE plan must exist).
