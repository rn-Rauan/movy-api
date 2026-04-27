# Payment Module

Manages payment records for the Movy platform. Payments are created automatically by
`CreateBookingUseCase` when a booking is confirmed, starting with status `PENDING`.
This module exposes read-only endpoints — write operations are the responsibility of
the Bookings module.

---

## Module Structure

```
payment/
├── application/
│   ├── dtos/
│   │   └── payment-response.dto.ts         # HTTP output
│   └── use-cases/
│       ├── find-payment-by-id.use-case.ts
│       └── find-payments-by-organization.use-case.ts
├── domain/
│   ├── entities/
│   │   └── payment.entity.ts               # Aggregate root
│   ├── errors/
│   │   └── payment.errors.ts               # Domain errors
│   └── interfaces/
│       ├── payment.repository.ts           # Abstract contract
│       └── enums/
│           ├── method-payment.enum.ts      # Payment methods
│           └── payment-status.enum.ts      # Payment lifecycle
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── payment.mapper.ts           # Prisma ↔ Domain
│       └── repositories/
│           └── prisma-payment.repository.ts
└── presentation/
    ├── controllers/
    │   └── payment.controller.ts
    └── mappers/
        └── payment.presenter.ts            # Domain → DTO
```

---

## Domain

### `PaymentEntity`

Aggregate root representing a payment linked to a booking.

| Property         | Type            | Description                                        |
|------------------|-----------------|----------------------------------------------------|
| `id`             | `string`        | UUID generated in the domain via `crypto.randomUUID()` |
| `organizationId` | `string`        | UUID of the organization that owns the booking     |
| `enrollmentId`   | `string`        | FK to the booking record (1:1)                     |
| `method`         | `MethodPayment` | Payment method selected at booking time            |
| `amount`         | `Money`         | Amount charged at booking time (Value Object)      |
| `status`         | `PaymentStatus` | Current payment state                              |
| `createdAt`      | `Date`          | Creation timestamp (immutable)                     |
| `updatedAt`      | `Date`          | Last update timestamp                              |

**Rules:**
- Always created with `status = PENDING`.
- UUID is generated in the domain, not by the database.
- `amount` is the price recorded at booking time — it does not change if the plan changes later.

### `MethodPayment` (enum)

| Value          | Description        |
|----------------|--------------------|
| `MONEY`        | Cash               |
| `PIX`          | PIX transfer       |
| `CREDIT_CARD`  | Credit card        |
| `DEBIT_CARD`   | Debit card         |

### `PaymentStatus` (enum)

| Value       | Description                |
|-------------|----------------------------|
| `PENDING`   | Awaiting processing        |
| `COMPLETED` | Payment settled            |
| `FAILED`    | Payment rejected / failed  |

---

## Domain Errors

| Code                                  | HTTP | Description                        |
|---------------------------------------|------|------------------------------------|
| `PAYMENT_NOT_FOUND`                   | 404  | Payment not found by id            |
| `PAYMENT_CREATION_FAILED_BAD_REQUEST` | 400  | Failed to persist the payment      |

---

## Use Cases

| Use Case                            | Input                                  | Output                               | Possible Errors        |
|-------------------------------------|----------------------------------------|--------------------------------------|------------------------|
| `FindPaymentByIdUseCase`            | `id: string`                           | `PaymentEntity`                      | `PaymentNotFoundError` |
| `FindPaymentsByOrganizationUseCase` | `organizationId`, `PaginationOptions`  | `PaginatedResponse<PaymentEntity>`   | —                      |

> **Payment creation** is the responsibility of `CreateBookingUseCase` in the `bookings` module.
> It injects `PaymentRepository` directly and creates the payment atomically with the booking.

---

## Endpoints

Base path: `/organizations/:organizationId/payments`

| Method | Path                                           | Guards                     | Description                                              |
|--------|------------------------------------------------|----------------------------|----------------------------------------------------------|
| `GET`  | `/organizations/:organizationId/payments/:id`  | JWT + TenantFilter + Admin | Find payment by UUID                                     |
| `GET`  | `/organizations/:organizationId/payments`      | JWT + TenantFilter + Admin | List organization payments (paginated, descending order) |

> Both endpoints require role **`ADMIN`** and are tenant-filtered via `TenantFilterGuard` —
> an admin can only see payments belonging to their own organization.

---

## Module Exports

- **`PaymentRepository`** — injectable in `BookingsModule` for payment creation during the booking flow.

---

## Creation Flow (via Bookings)

```
POST /bookings
    │
    ▼
CreateBookingUseCase
    │  1. Create and save BookingEntity
    │  2. Create PaymentEntity.create({ ... })
    │  3. Save via PaymentRepository.save()
    ▼
PrismaPaymentRepository
    │
    ▼
PaymentEntity (status = PENDING)
```

## Read Flow

```
GET /organizations/:orgId/payments/:id
    │
    ▼
PaymentController         (presentation/controllers)
    │  calls execute()
    ▼
FindPaymentByIdUseCase    (application/use-cases)
    │  calls repository
    ▼
PaymentRepository         (domain/interfaces — abstract)
    │  implemented by
    ▼
PrismaPaymentRepository   (infrastructure/db/repositories)
    │  uses
    ▼
PaymentMapper             (infrastructure/db/mappers)
    │  toDomain
    ▼
PaymentEntity             (domain/entities)
    │
    ▼ (returns to controller)
PaymentPresenter.toHTTP() (presentation/mappers)
    │
    ▼
PaymentResponseDto        (HTTP response)
```
