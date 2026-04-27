# Trip Module

Manages the two core resources of the trip domain:

- **`TripTemplate`** — a reusable blueprint that defines a route, pricing tiers, recurrence schedule, and auto-cancel rules.
- **`TripInstance`** — a concrete scheduled execution of a `TripTemplate`, with its own lifecycle state machine and capacity snapshot.

---

## Domain Entities

### TripTemplate

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `organizationId` | `string` | UUID of the owning organisation |
| `departurePoint` | `string` | Starting location |
| `destination` | `string` | Final destination |
| `stops` | `string[]` | Ordered intermediate stops (min 2) |
| `shift` | `Shift` | `MORNING`, `AFTERNOON`, or `EVENING` |
| `frequency` | `DayOfWeek[]` | Days of week for recurring templates |
| `priceOneWay` | `Money \| null` | Price for one-way enrollment |
| `priceReturn` | `Money \| null` | Price for return enrollment |
| `priceRoundTrip` | `Money \| null` | Price for round-trip enrollment |
| `isPublic` | `boolean` | Visible across organisations |
| `isRecurring` | `boolean` | Whether the trip recurs weekly |
| `autoCancelEnabled` | `boolean` | Auto-cancel on low revenue |
| `minRevenue` | `Money \| null` | Revenue threshold for auto-cancel |
| `autoCancelOffset` | `number \| null` | Minutes before departure to evaluate |
| `status` | `Status` | `ACTIVE` or `INACTIVE` |

### TripInstance

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `organizationId` | `string` | UUID of the owning organisation |
| `tripTemplateId` | `string` | UUID of the parent template |
| `driverId` | `string \| null` | Assigned driver |
| `vehicleId` | `string \| null` | Assigned vehicle |
| `tripStatus` | `TripStatus` | Current lifecycle state |
| `totalCapacity` | `number` | Seat capacity snapshot |
| `departureTime` | `Date` | Scheduled departure |
| `arrivalEstimate` | `Date` | Estimated arrival |
| `minRevenue` | `Money \| null` | Auto-cancel revenue threshold (per-instance override) |
| `autoCancelAt` | `Date \| null` | Computed auto-cancel evaluation time |
| `forceConfirm` | `boolean` | Admin override to bypass auto-cancel |

---

## TripInstance State Machine

```
DRAFT → SCHEDULED (requires driverId + vehicleId) | CANCELED
SCHEDULED → CONFIRMED | CANCELED
CONFIRMED → IN_PROGRESS | SCHEDULED (revert) | CANCELED
IN_PROGRESS → FINISHED | CANCELED
FINISHED → terminal
CANCELED → terminal
```

---

## Use Cases

### TripTemplate

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateTripTemplateUseCase` | `POST /trip-templates/organization/:organizationId` | Org Admin |
| `FindAllTripTemplatesByOrganizationUseCase` | `GET /trip-templates/organization/:organizationId` | Org Admin |
| `FindTripTemplateByIdUseCase` | `GET /trip-templates/:id` | Org Admin |
| `UpdateTripTemplateUseCase` | `PUT /trip-templates/:id` | Org Admin |
| `DeactivateTripTemplateUseCase` | `DELETE /trip-templates/:id` | Org Admin |

### TripInstance

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateTripInstanceUseCase` | `POST /trip-instances/organization/:organizationId` | Org Admin |
| `FindAllTripInstancesByOrganizationUseCase` | `GET /trip-instances/organization/:organizationId` | Org Admin |
| `FindTripInstancesByTemplateUseCase` | `GET /trip-instances/template/:templateId` | Org Admin |
| `FindTripInstanceByIdUseCase` | `GET /trip-instances/:id` | Org Admin |
| `TransitionTripInstanceStatusUseCase` | `PATCH /trip-instances/:id/status` | Org Admin |
| `AssignDriverToTripInstanceUseCase` | `PUT /trip-instances/:id/driver` | Org Admin |
| `AssignVehicleToTripInstanceUseCase` | `PUT /trip-instances/:id/vehicle` | Org Admin |

### Business Rules

- At least one price tier (`priceOneWay`, `priceReturn`, `priceRoundTrip`) must be set on a template.
- Recurring templates must have at least one `DayOfWeek` in `frequency`.
- When `autoCancelEnabled = true`, both `minRevenue` and a positive `autoCancelOffset` (minutes) are required.
- A new instance always starts as `DRAFT`. Transitioning to `SCHEDULED` or beyond requires both a driver and a vehicle.
- `autoCancelAt` is computed as `departureTime − autoCancelOffset minutes` and stored as a snapshot on the instance.

---

## Domain Errors

### TripTemplate Errors

| Error Class | HTTP | Code |
|---|---|---|
| `InvalidTripRoutePointsError` | 400 | `INVALID_TRIP_ROUTE_POINTS` |
| `InvalidTripStopsError` | 400 | `INVALID_TRIP_STOPS` |
| `InvalidTripPriceConfigurationError` | 400 | `INVALID_TRIP_PRICE_CONFIGURATION` |
| `InvalidTripFrequencyError` | 400 | `INVALID_TRIP_FREQUENCY` |
| `InvalidTripAutoCancelConfigurationError` | 400 | `INVALID_TRIP_AUTO_CANCEL_CONFIGURATION` |
| `TripTemplateNotFoundError` | 404 | `TRIP_TEMPLATE_NOT_FOUND` |
| `TripTemplateAccessForbiddenError` | 403 | `TRIP_TEMPLATE_ACCESS_FORBIDDEN` |
| `TripTemplateInactiveError` | 400 | `TRIP_TEMPLATE_INACTIVE` |
| `TripTemplateCreationFailedError` | 400 | `TRIP_TEMPLATE_CREATION_FAILED` |

### TripInstance Errors

| Error Class | HTTP | Code |
|---|---|---|
| `InvalidTripInstanceCapacityError` | 400 | `TRIP_INSTANCE_CAPACITY_BAD_REQUEST` |
| `InvalidTripInstanceTimesError` | 400 | `TRIP_INSTANCE_TIMES_BAD_REQUEST` |
| `InvalidTripInstanceAutoCancelTimeError` | 400 | `TRIP_INSTANCE_AUTO_CANCEL_BAD_REQUEST` |
| `InvalidTripStatusTransitionError` | 400 | `TRIP_INSTANCE_STATUS_TRANSITION_BAD_REQUEST` |
| `TripInstanceRequiredFieldError` | 400 | `TRIP_INSTANCE_REQUIRED_FIELD_BAD_REQUEST` |
| `TripInstanceNotFoundError` | 404 | `TRIP_INSTANCE_NOT_FOUND` |
| `TripInstanceAccessForbiddenError` | 403 | `TRIP_INSTANCE_ACCESS_FORBIDDEN` |
| `TripInstanceCreationFailedError` | 400 | `TRIP_INSTANCE_CREATION_FAILED_BAD_REQUEST` |

---

## Module Dependencies

```
TripModule
  ├── DriverModule     (DriverRepository — validates driver existence on assignment)
  └── VehicleModule    (VehicleRepository — validates vehicle existence on assignment)

Exports:
  TripTemplateRepository  → consumed by BookingsModule (price resolution)
  TripInstanceRepository  → consumed by BookingsModule (capacity checks + bookability)
```

---

## Architecture

```
trip/
  domain/
    entities/
      trip-template.entity.ts       # TripTemplate aggregate root
      trip-instance.entity.ts       # TripInstance aggregate root
      errors/
        trip-template.errors.ts     # Domain errors → HTTP codes
        trip-instance.errors.ts
    interfaces/
      trip-template.repository.ts   # Abstract repository contract
      trip-instance.repository.ts
      enums/
        day-of-week.enum.ts         # SUNDAY … SATURDAY
        shift.enum.ts               # MORNING | AFTERNOON | EVENING
        trip-status.enum.ts         # DRAFT → FINISHED | CANCELED
  application/
    use-cases/                      # One file per use case
    dtos/                           # Input/output DTOs (class-validator + Swagger)
  infrastructure/
    db/
      mappers/
        trip-template.mapper.ts     # Prisma TripTemplate ↔ domain
        trip-instance.mapper.ts     # Prisma TripInstance ↔ domain
      repositories/
        prisma-trip-template.repository.ts
        prisma-trip-instance.repository.ts
  presentation/
    controllers/
      trip-template.controller.ts   # Base path: /trip-templates
      trip-instance.controller.ts   # Base path: /trip-instances
    mappers/
      trip-template.presenter.ts    # TripTemplate → TripTemplateResponseDto
      trip-instance.presenter.ts    # TripInstance → TripInstanceResponseDto
  trip.module.ts
```

---

## Guards & Access Control

All endpoints in this module are restricted to **organisation administrators** only:

| Guard | Applied to |
|---|---|
| `JwtAuthGuard` | All endpoints (controller-level) |
| `RolesGuard` + `@Roles(ADMIN)` | All endpoints (method-level) |
| `TenantFilterGuard` | All endpoints (method-level) |
