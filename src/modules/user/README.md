# User Module

Manages the `User` aggregate — registered users of the Movy platform, including
self-service profile management and developer-only administrative endpoints.

---

## Domain Entity

### User

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `name` | `UserName` | Display name Value Object (3–255 chars, trimmed) |
| `email` | `Email` | Email Value Object; unique in the system |
| `passwordHash` | `PasswordHash` | Bcrypt hash Value Object; never returned in responses |
| `telephone` | `Telephone` | Telephone Value Object |
| `status` | `Status` | `ACTIVE` or `INACTIVE` |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp (refreshed on every mutation) |

### Value Objects

| VO | Validation Rules |
|---|---|
| `UserName` | Non-empty; 3–255 characters after trimming |
| `PasswordHash` | Non-empty; minimum 8 characters (stores bcrypt hash, not plaintext) |
| `Email` | Valid email format (shared VO from `shared/domain`) |
| `Telephone` | Brazilian phone format (shared VO from `shared/domain`) |

---

## Use Cases

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateUserUseCase` | `POST /users` | Dev only (`DevGuard`) |
| `FindUserByIdUseCase` | `GET /users/:id` | Dev only (deprecated — use `/me`) |
| `FindAllUsersUseCase` | `GET /users` | Dev only |
| `FindAllActiveUsersUseCase` | `GET /users/active` | Dev only |
| `UpdateUserUseCase` | `PUT /users/me` | Authenticated user |
| `DisableUserUseCase` | `DELETE /users/me` | Authenticated user |

### Self-Service Endpoints (no DevGuard)

| Endpoint | Description |
|---|---|
| `GET /users/me` | Returns the current user's profile |
| `PUT /users/me` | Updates the current user's profile (name, email, telephone, password) |
| `DELETE /users/me` | Soft-deletes the current user's account (sets status to `INACTIVE`) |

### Business Rules

- `email` must be unique; `UserEmailAlreadyExistsError` is thrown on conflict.
- `DELETE /users/me` performs a **soft delete** — status is set to `INACTIVE`, the row is not removed.
- Inactive users cannot be updated; `InactiveUserError` is thrown.
- `FindUserByIdUseCase` treats `INACTIVE` users as non-existent; the same `UserNotFoundError` is thrown.
- Password changes are re-hashed by `HashProvider` (bcrypt) — plaintext is never persisted.

---

## Domain Errors

| Error Class | HTTP | Code |
|---|---|---|
| `InvalidUserNameError` | 400 | `INVALID_USER_NAME` |
| `InvalidUserTelephoneError` | 400 | `INVALID_USER_TELEPHONE` |
| `InvalidPasswordError` | 400 | `INVALID_PASSWORD` |
| `UserNotFoundError` | 404 | `USER_NOT_FOUND` |
| `UserEmailAlreadyExistsError` | 409 | `USER_EMAIL_ALREADY_EXISTS` |
| `InactiveUserError` | 400 | `INACTIVE_USER` |

---

## Module Dependencies

```
UserModule
  ├── PrismaModule    (PrismaService)
  └── SharedModule    (guards, decorators, exception filters)
  [internal] HashProvider → BcryptHashProvider (not exported)

Exports:
  UserRepository          → AuthModule, MembershipModule
  CreateUserUseCase       → AuthModule (registration flow)
  UpdateUserUseCase       → AuthModule
  FindUserByIdUseCase     → AuthModule, MembershipModule
  FindAllActiveUsersUseCase
  FindAllUsersUseCase
```

---

## Architecture

```
user/
  domain/
    entities/
      user.entity.ts                    # User aggregate root
      errors/
        user.errors.ts                  # Domain errors → HTTP codes
      value-objects/
        user-name.value-object.ts       # UserName VO (3–255 chars)
        password-hash.value-object.ts   # PasswordHash VO (bcrypt hash)
    interfaces/
      user.repository.ts                # Abstract repository contract
  application/
    use-cases/                          # One file per use case
    dtos/
      create-user.dto.ts                # POST /users input
      update-user.dto.ts                # PUT /users/me input (all optional)
      user-response.dto.ts              # Shared output DTO (excludes passwordHash)
  infrastructure/
    db/
      mappers/
        user.mapper.ts                  # Prisma User ↔ User domain
      repositories/
        prisma-user.repository.ts       # Prisma implementation
  presentation/
    controllers/
      user.controller.ts                # Base path: /users
    mappers/
      user.presenter.ts                 # User → UserResponseDto
  user.module.ts
```

---

## Guards & Access Control

| Endpoint | Guards |
|---|---|
| `POST /users`, `GET /users`, `GET /users/active`, `GET /users/:id`, `DELETE /users/:id` | `JwtAuthGuard` + `DevGuard` |
| `GET /users/me`, `PUT /users/me`, `DELETE /users/me` | `JwtAuthGuard` only |
