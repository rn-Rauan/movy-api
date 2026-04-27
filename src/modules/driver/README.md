# Driver Module

Manages the `Driver` aggregate — driver profiles linked to platform users,
including CNH (Brazilian driver license) management and organization-scoped operations.

---

## Domain Entity

### DriverEntity

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `userId` | `string` (UUID) | Reference to the owning `User`; one-to-one |
| `cnh` | `Cnh` | CNH number Value Object (9–12 alphanumeric chars) |
| `cnhCategory` | `CnhCategory` | License category Value Object (A–E) |
| `cnhExpiresAt` | `Date` | CNH expiration date |
| `driverStatus` | `DriverStatus` | `ACTIVE`, `INACTIVE`, or `SUSPENDED` |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

### Value Objects

| VO | Validation Rules |
|---|---|
| `Cnh` | 9–12 alphanumeric characters (trimmed); use `restore()` to skip validation from persistence |
| `CnhCategory` | Exactly one of `A`, `B`, `C`, `D`, `E` (case-insensitive on input, stored uppercase) |

### Business Rules

- A user may only have **one** driver profile — `CreateDriverUseCase` enforces uniqueness.
- CNH fields (`cnh`, `cnhCategory`, `cnhExpiresAt`) follow an **all-or-nothing** update rule; sending only some fields throws `PartialCnhUpdateError`.
- `DELETE /drivers/:id` performs a **soft delete** — status is set to `INACTIVE`, the row is not removed.
- All `GET/PUT/DELETE /drivers/:id` endpoints validate that the driver belongs to the requesting organization via `DriverRepository.belongsToOrganization`.

---

## Use Cases

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateDriverUseCase` | `POST /drivers` | Authenticated user (self) |
| `FindDriverByUserIdUseCase` | `GET /drivers/me` | Authenticated user (self) |
| `LookupDriverUseCase` | `GET /drivers/lookup?email&cnh` | Admin (`RolesGuard`) |
| `FindAllDriversByOrganizationUseCase` | `GET /drivers` | Admin |
| `FindDriverByIdUseCase` | `GET /drivers/:id` | Admin |
| `UpdateDriverUseCase` | `PUT /drivers/:id` | Admin |
| `RemoveDriverUseCase` | `DELETE /drivers/:id` | Admin — soft delete |

---

## Domain Errors

| Error Class | HTTP | Code |
|---|---|---|
| `InvalidCnhError` | 400 | `INVALID_CNH` |
| `InvalidCnhCategoryError` | 400 | `INVALID_CNH_CATEGORY` |
| `InvalidCnhExpirationError` | 400 | `INVALID_CNH_EXPIRATION` |
| `ExpiredCnhError` | 400 | `EXPIRED_CNH` |
| `InvalidDriverStatusError` | 400 | `INVALID_DRIVER_STATUS` |
| `PartialCnhUpdateError` | 400 | `INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST` |
| `DriverNotFoundError` | 404 | `DRIVER_NOT_FOUND_BAD_REQUEST` |
| `DriverProfileNotFoundByEmailError` | 404 | `DRIVER_PROFILE_NOT_FOUND_BAD_REQUEST` |
| `DriverAlreadyExistsError` | 409 | `DRIVER_ALREADY_EXISTS_CONFLICT` |
| `DriverAccessForbiddenError` | 403 | `DRIVER_ACCESS_FORBIDDEN` |
| `DriverCreationFailedError` | 500 | `DRIVER_CREATION_FAILED` |
| `DriverUpdateFailedError` | 500 | `DRIVER_UPDATE_FAILED` |

---

## Module Dependencies

```
DriverModule
  ├── PrismaModule    (PrismaService)
  ├── SharedModule    (guards, decorators, exception filters)
  └── UserModule      (UserRepository — consumed by LookupDriverUseCase)

Exports:
  DriverRepository
  CreateDriverUseCase
  FindDriverByIdUseCase
  FindDriverByUserIdUseCase
  UpdateDriverUseCase
  RemoveDriverUseCase
  FindAllDriversByOrganizationUseCase
  LookupDriverUseCase
```

---

## Architecture

```
driver/
  domain/
    entities/
      driver.entity.ts                    # DriverEntity aggregate root
      errors/
        driver.errors.ts                  # Domain errors → HTTP codes
      value-objects/
        cnh.value-object.ts               # Cnh VO (9–12 alphanumeric)
        cnh-category.value-object.ts      # CnhCategory VO (A–E)
    interfaces/
      driver.repository.ts                # Abstract repository contract
      enums/
        driver-status.enum.ts             # ACTIVE | INACTIVE | SUSPENDED
  application/
    use-cases/                            # One file per use case
    dtos/
      create-driver.dto.ts                # POST /drivers input
      update-driver.dto.ts                # PUT /drivers/:id input (all optional)
      driver-response.dto.ts              # Shared output DTO
      driver-lookup-response.dto.ts       # GET /drivers/lookup output
  infrastructure/
    db/
      mappers/
        driver.mapper.ts                  # PrismaDriver ↔ DriverEntity
      repositories/
        prisma-driver.repository.ts       # Prisma implementation
  presentation/
    controllers/
      driver.controller.ts                # Base path: /drivers
    mappers/
      driver.presenter.ts                 # DriverEntity → DriverResponseDto
  driver.module.ts
```

---

## Guards & Access Control

| Endpoint | Guards |
|---|---|
| `POST /drivers`, `GET /drivers/me` | `JwtAuthGuard` only |
| `GET /drivers/lookup`, `GET /drivers`, `GET /drivers/:id`, `PUT /drivers/:id`, `DELETE /drivers/:id` | `JwtAuthGuard` + `RolesGuard` (`ADMIN`) + `TenantFilterGuard` |
