# Bookings Module

Manages **passenger enrollments** in trip instances. A _booking_ (domain: `Booking`, table: `enrollment`) represents a confirmed seat reservation made by an authenticated user for a specific `TripInstance`.

---

## Domain Entity

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `userId` | `string` | UUID of the passenger |
| `tripInstanceId` | `string` | UUID of the linked trip instance |
| `organizationId` | `string` | UUID of the owning organisation |
| `boardingStop` | `string` | Stop where the passenger boards |
| `alightingStop` | `string` | Stop where the passenger alights |
| `enrollmentType` | `EnrollmentType` | `MONTHLY`, `WEEKLY`, `DAILY`, or `SINGLE` |
| `recordedPrice` | `Money` | Immutable price snapshot resolved at booking time |
| `status` | `Status` | `ACTIVE` or `INACTIVE` (soft-cancel) |
| `presenceConfirmed` | `boolean` | Flipped by org members on the day of travel |
| `enrollmentDate` | `Date` | Timestamp of the booking |

> `recordedPrice` is **always** resolved server-side from `TripTemplate` — never accepted from the client body.

---

## Use Cases

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateBookingUseCase` | `POST /bookings` | Any authenticated user |
| `CancelBookingUseCase` | `PATCH /bookings/:id/cancel` | Owner **or** org member (Admin/Driver) |
| `ConfirmPresenceUseCase` | `PATCH /bookings/:id/confirm-presence` | Org member only (Admin/Driver) |
| `FindBookingByIdUseCase` | `GET /bookings/:id` | Owner or org member |
| `FindBookingDetailsUseCase` | `GET /bookings/:id/details` | Owner or org member |
| `FindBookingsByOrganizationUseCase` | `GET /bookings/organization/:organizationId` | Org Admin + `TenantFilterGuard` |
| `FindBookingsByUserUseCase` | `GET /bookings/user` | Any authenticated user (own bookings) |
| `FindBookingsByTripInstanceUseCase` | `GET /bookings/trip-instance/:tripInstanceId` | Org member of the owning org |
| `GetBookingAvailabilityUseCase` | `GET /bookings/availability/:tripInstanceId` | Any authenticated user |

### Business Rules

- **Duplicate booking**: A user cannot have more than one `ACTIVE` booking per trip instance (`BookingAlreadyExistsError`).
- **Capacity enforcement**: If `activeCount >= totalCapacity` the booking is rejected (`TripInstanceFullError`).
- **Bookable statuses**: Only trip instances with status `SCHEDULED` or `CONFIRMED` accept new bookings.
- **Cancellation deadline**: Cancellation is blocked within **30 minutes** of departure (`BookingCancellationDeadlineError`).
- **Payment side-effect**: `CreateBookingUseCase` also creates a `PaymentEntity` with `status = PENDING` atomically with the booking.

---

## Domain Errors

| Error Class | HTTP | Code | Trigger |
|---|---|---|---|
| `BookingNotFoundError` | 404 | `BOOKING_NOT_FOUND` | No booking with the given UUID |
| `BookingAccessForbiddenError` | 403 | `BOOKING_ACCESS_FORBIDDEN` | Caller is neither owner nor org member |
| `BookingAlreadyExistsError` | 409 | `BOOKING_ALREADY_EXISTS_CONFLICT` | Duplicate active booking for same trip |
| `InvalidBookingStopError` | 400 | `BOOKING_STOP_BAD_REQUEST` | `boardingStop` / `alightingStop` empty or equal |
| `BookingCreationFailedError` | 400 | `BOOKING_CREATION_FAILED_BAD_REQUEST` | Repository failed to persist the booking |
| `TripInstanceNotBookableError` | 400 | `BOOKING_TRIP_INSTANCE_NOT_BOOKABLE_BAD_REQUEST` | Trip instance not in `SCHEDULED`/`CONFIRMED` |
| `TripInstanceFullError` | 409 | `BOOKING_TRIP_INSTANCE_FULL_CONFLICT` | Active bookings at max capacity |
| `BookingCancellationNotAllowedError` | 400 | `BOOKING_CANCELLATION_NOT_ALLOWED_BAD_REQUEST` | Trip is `IN_PROGRESS` or `FINISHED` |
| `BookingCancellationDeadlineError` | 400 | `BOOKING_CANCELLATION_DEADLINE_BAD_REQUEST` | Within 30 min of departure |
| `BookingAlreadyInactiveError` | 400 | `BOOKING_ALREADY_INACTIVE_BAD_REQUEST` | Booking is already cancelled |
| `TripPriceNotAvailableError` | 400 | `BOOKING_PRICE_NOT_AVAILABLE_BAD_REQUEST` | No price configured for the enrollment type |

---

## Module Dependencies

```
BookingsModule
  ├── TripModule          (TripInstanceRepository, TripTemplateRepository)
  └── PaymentModule       (PaymentRepository — for PENDING payment creation)
```

---

## Architecture

```
bookings/
  domain/
    entities/
      booking.entity.ts          # Booking aggregate root
      errors/
        booking.errors.ts        # Domain errors → HTTP status codes
    interfaces/
      booking.repository.ts      # Abstract repository contract
      enums/
        enrollment-type.enum.ts  # MONTHLY | WEEKLY | DAILY | SINGLE
  application/
    use-cases/                   # One file per use case
    dtos/                        # Input/output DTOs (class-validator + Swagger)
  infrastructure/
    db/
      mappers/
        booking.mapper.ts        # Prisma Enrollment ↔ Booking domain
      repositories/
        prisma-booking.repository.ts
  presentation/
    controllers/
      booking.controller.ts      # Base path: /bookings
    mappers/
      booking.presenter.ts       # Booking → BookingResponseDto
  bookings.module.ts
```

---

## Guards & Access Control

| Guard | Applied to |
|---|---|
| `JwtAuthGuard` | All endpoints (controller-level) |
| `RolesGuard` + `@Roles(ADMIN)` | `GET /organization/:organizationId` |
| `TenantFilterGuard` | `GET /organization/:organizationId` |

The `PATCH /bookings/:id/cancel` and `GET /bookings/:id` endpoints perform **in-use-case** access control: the use case compares the caller's `userId` and `organizationId` (from the JWT payload) against the booking's stored values.
