# Plans Module

Manages the subscription plans available on the Movy platform. Plans define an
organization's operational limits (vehicles, drivers, monthly trips) and the
monthly price charged.

---

## Module Structure

```
plans/
├── application/
│   ├── dtos/
│   │   ├── create-plan.dto.ts       # Creation input
│   │   ├── update-plan.dto.ts       # Update input (partial, name excluded)
│   │   └── plan-response.dto.ts     # HTTP output
│   └── use-cases/
│       ├── create-plan.use-case.ts
│       ├── update-plan.use-case.ts
│       ├── deactivate-plan.use-case.ts
│       ├── find-plan-by-id.use-case.ts
│       └── find-all-plans.use-case.ts
├── domain/
│   ├── entities/
│   │   └── plan.entity.ts           # Aggregate root
│   ├── errors/
│   │   └── plan.errors.ts           # Domain errors
│   └── interfaces/
│       ├── plan.repository.ts       # Abstract contract
│       └── enums/
│           └── plan-name.enum.ts    # Plan tiers
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── plan.mapper.ts       # Prisma ↔ Domain
│       └── repositories/
│           └── prisma-plan.repository.ts
└── presentation/
    ├── controllers/
    │   └── plan.controller.ts
    └── mappers/
        └── plan.presenter.ts        # Domain → DTO
```

---

## Domain

### `PlanEntity`

Aggregate root representing a subscription plan.

| Property          | Type       | Description                                    |
|-------------------|------------|------------------------------------------------|
| `id`              | `number`   | Auto-increment PK (assigned by the database)   |
| `name`            | `PlanName` | Unique tier identifier — immutable             |
| `price`           | `Money`    | Monthly price (Value Object)                   |
| `maxVehicles`     | `number`   | Vehicle limit per organization                 |
| `maxDrivers`      | `number`   | Driver limit per organization                  |
| `maxMonthlyTrips` | `number`   | Monthly trip limit                             |
| `isActive`        | `boolean`  | Whether the plan accepts new subscriptions     |
| `createdAt`       | `Date`     | Creation timestamp (immutable)                 |
| `updatedAt`       | `Date`     | Last update timestamp                          |

**Rules:**
- `name` is immutable after creation.
- `deactivate()` only sets `isActive = false` — it does not cancel existing subscriptions.
- `id = 0` on in-memory creation; replaced by the database after `save()`.

### `PlanName` (enum)

| Value     | Description                    |
|-----------|--------------------------------|
| `FREE`    | Free tier — limited resources  |
| `BASIC`   | Basic tier                     |
| `PRO`     | Professional tier              |
| `PREMIUM` | Premium tier — maximum limits  |

---

## Domain Errors

| Code                               | HTTP | Description                        |
|------------------------------------|------|------------------------------------|
| `PLAN_NOT_FOUND`                   | 404  | Plan not found by id               |
| `PLAN_ALREADY_EXISTS`              | 409  | A plan with the same name exists   |
| `PLAN_CREATION_FAILED_BAD_REQUEST` | 400  | Failed to persist the plan         |

---

## Use Cases

| Use Case                | Input               | Output                          | Possible Errors                                        |
|-------------------------|---------------------|---------------------------------|--------------------------------------------------------|
| `CreatePlanUseCase`     | `CreatePlanDto`     | `PlanEntity`                    | `PlanAlreadyExistsError`, `PlanCreationFailedError`    |
| `UpdatePlanUseCase`     | `id`, `UpdatePlanDto` | `PlanEntity`                  | `PlanNotFoundError`                                    |
| `DeactivatePlanUseCase` | `id`                | `PlanEntity`                    | `PlanNotFoundError`                                    |
| `FindPlanByIdUseCase`   | `id`                | `PlanEntity`                    | `PlanNotFoundError`                                    |
| `FindAllPlansUseCase`   | `PaginationOptions` | `PaginatedResponse<PlanEntity>` | —                                                      |

---

## Endpoints

Base path: `/plans`

| Method  | Path                    | Guards    | Description                         |
|---------|-------------------------|-----------|-------------------------------------|
| `POST`  | `/plans`                | JWT + Dev | Create a new plan                   |
| `PATCH` | `/plans/:id`            | JWT + Dev | Update price / limits               |
| `PATCH` | `/plans/:id/deactivate` | JWT + Dev | Deactivate the plan                 |
| `GET`   | `/plans`                | JWT       | List all plans (paginated)          |
| `GET`   | `/plans/:id`            | JWT       | Find plan by id                     |

> **Write operations** are protected by `DevGuard` — available only in development
> environments (`NODE_ENV !== 'production'`).

---

## Module Exports

- **`PlanRepository`** — injectable in `SubscriptionsModule` and any module that needs
  to query or validate plans.

---

## Data Flow

```
HTTP Request
    │
    ▼
PlanController          (presentation/controllers)
    │  calls execute()
    ▼
[Use Case]              (application/use-cases)
    │  calls repository
    ▼
PlanRepository          (domain/interfaces — abstract)
    │  implemented by
    ▼
PrismaPlanRepository    (infrastructure/db/repositories)
    │  uses
    ▼
PlanMapper              (infrastructure/db/mappers)
    │  toDomain / toPersistence
    ▼
PlanEntity              (domain/entities)
    │
    ▼ (returns to controller)
PlanPresenter.toHTTP()  (presentation/mappers)
    │
    ▼
PlanResponseDto         (HTTP response)
```
