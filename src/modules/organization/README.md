# Organization Module

Manages the `Organization` aggregate — the top-level tenant entity in Movy.
Each organization has unique `cnpj`, `email`, and `slug` fields and can
have multiple user memberships. Soft-delete is used: organizations are marked
`INACTIVE` rather than physically removed.

---

## Entity

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID v4) | Primary key |
| `name` | `OrganizationName` | 2–255 chars |
| `cnpj` | `Cnpj` | Unique, stored as `XX.XXX.XXX/XXXX-XX` |
| `email` | `Email` | Unique contact e-mail (shared VO) |
| `telephone` | `Telephone` | Contact phone (shared VO) |
| `slug` | `Slug` | Unique URL-safe identifier |
| `address` | `Address` | Free-form, 1–255 chars |
| `status` | `ACTIVE \| INACTIVE` | `ACTIVE` on creation |
| `createdAt` | `Date` | Set once on creation |
| `updatedAt` | `Date` | Refreshed on every mutation |

---

## Value Objects

| VO | Constraint | Error thrown |
|---|---|---|
| `OrganizationName` | 2–255 chars (trimmed) | `InvalidOrganizationNameError` / `StringLengthError` |
| `Cnpj` | Valid Brazilian CNPJ (digits or masked) | `InvalidCnpjError` |
| `Slug` | `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` | `InvalidSlugError` |
| `Address` | 1–255 chars | `InvalidAddressError` |
| `Email` | RFC-compliant (shared VO) | `InvalidEmailError` |
| `Telephone` | Numeric string (shared VO) | `InvalidTelephoneError` |

---

## Domain Errors

| Class | HTTP | Code |
|---|---|---|
| `OrganizationValidationError` | 400 | _(abstract base)_ |
| `InvalidOrganizationNameError` | 400 | `INVALID_ORGANIZATION_NAME` |
| `InvalidCnpjError` | 400 | `INVALID_CNPJ` |
| `InvalidSlugError` | 400 | `INVALID_SLUG` |
| `InvalidAddressError` | 400 | `INVALID_ADDRESS` |
| `InactiveOrganizationError` | 400 | `INACTIVE_ORGANIZATION` |
| `OrganizationNotFoundError` | 404 | `ORGANIZATION_NOT_FOUND` |
| `OrganizationAlreadyExistsError` | 409 | `ORGANIZATION_ALREADY_EXISTS` |
| `OrganizationEmailAlreadyExistsError` | 409 | `ORGANIZATION_EMAIL_ALREADY_EXISTS` |
| `OrganizationSlugAlreadyExistsError` | 409 | `ORGANIZATION_SLUG_ALREADY_EXISTS` |
| `OrganizationForbiddenError` | 403 | `ORGANIZATION_ACCESS_FORBIDDEN` |

---

## API Endpoints

| Method | Path | Guard | Use Case |
|---|---|---|---|
| `POST` | `/organizations` | `DevGuard` | `CreateOrganizationUseCase` |
| `GET` | `/organizations` | `DevGuard` | `FindAllOrganizationsUseCase` |
| `GET` | `/organizations/me` | `JwtAuthGuard` + `RolesGuard(ADMIN, DRIVER)` | `FindOrganizationByUserUseCase` |
| `GET` | `/organizations/active` | `JwtAuthGuard` | `FindAllActiveOrganizationsUseCase` |
| `GET` | `/organizations/:id` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindOrganizationByIdUseCase` |
| `PUT` | `/organizations/:id` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `UpdateOrganizationUseCase` |
| `DELETE` | `/organizations/:id` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `DisableOrganizationUseCase` |

---

## Use Cases

| Class | Description |
|---|---|
| `CreateOrganizationUseCase` | Enforces CNPJ and slug uniqueness; stores `ACTIVE` organization |
| `FindOrganizationByIdUseCase` | Returns active org by UUID; tenant-scoped via `TenantContextParams` |
| `FindOrganizationByUserUseCase` | Paginated list of orgs the user belongs to |
| `FindAllOrganizationsUseCase` | Dev-only: all orgs including `INACTIVE` |
| `FindAllActiveOrganizationsUseCase` | Public: paginated list of `ACTIVE` orgs |
| `UpdateOrganizationUseCase` | Partial update; checks uniqueness conflicts; blocks `INACTIVE` orgs |
| `DisableOrganizationUseCase` | Soft-delete: sets status to `INACTIVE`; tenant-scoped |

---

## Module Structure

```
src/modules/organization/
├── organization.module.ts
├── application/
│   ├── dtos/
│   │   ├── create-organization.dto.ts
│   │   ├── update-organization.dto.ts
│   │   └── organization-response.dto.ts
│   └── use-cases/
│       ├── create-organization.use-case.ts
│       ├── find-organization-by-id.use-case.ts
│       ├── find-organization-by-user.use-case.ts
│       ├── find-all-organizations.use-case.ts
│       ├── find-all-active-organizations.use-case.ts
│       ├── update-organization.use-case.ts
│       └── disable-organization.use-case.ts
├── domain/
│   ├── entities/
│   │   └── organization.entity.ts
│   ├── entities/errors/
│   │   └── organization.errors.ts
│   ├── entities/value-objects/
│   │   ├── cnpj.value-object.ts
│   │   ├── address.value-object.ts
│   │   ├── organization-name.value-object.ts
│   │   └── slug.value-object.ts
│   └── interfaces/
│       └── organization.repository.ts
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── organization.mapper.ts       # Prisma ↔ Domain
│       └── repositories/
│           └── prisma-organization.repository.ts
└── presentation/
    ├── controllers/
    │   └── organization.controller.ts
    └── mappers/
        └── organization.mapper.ts           # OrganizationPresenter (DI instance)
```

---

## Module Dependencies

**Imports:** `SharedModule` (re-exports `PrismaModule`, guards, decorators)

**Providers:**
- `PrismaOrganizationRepository` bound to the `OrganizationRepository` token
- `OrganizationPresenter` (instance — injected into controller)
- All 7 use case classes

**Exports:** All use cases + `OrganizationRepository` token