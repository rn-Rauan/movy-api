# Vehicle Module

Manages the `VehicleEntity` aggregate — physical vehicles registered to an organisation
that can be assigned to `TripInstance` executions.

---

## Domain Entity

### VehicleEntity

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary key |
| `plate` | `Plate` | Brazilian plate Value Object (`ABC1234` or `ABC1D23`) |
| `model` | `string` | Vehicle model description (e.g. `"Mercedes-Benz Sprinter"`) |
| `type` | `VehicleType` | `VAN`, `BUS`, `MINIBUS`, or `CAR` |
| `maxCapacity` | `number` | Maximum passenger capacity (positive integer, max 200) |
| `organizationId` | `string` | UUID of the owning organisation |
| `status` | `VehicleStatus` | `ACTIVE` or `INACTIVE` |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp (refreshed on every mutation) |

### `Plate` Value Object

Encapsulates Brazilian vehicle plate format validation. Two formats supported:

- **Old format**: `ABC1234` — 3 uppercase letters + 4 digits
- **Mercosul format**: `ABC1D23` — 3 uppercase letters + 1 digit + 1 uppercase letter + 2 digits

Input is normalised to uppercase with hyphens removed before validation.
Persisted as the normalised 7-character string.

---

## Use Cases

| Use Case | Endpoint | Access |
|---|---|---|
| `CreateVehicleUseCase` | `POST /vehicles/organization/:organizationId` | Org Admin |
| `FindAllVehiclesByOrganizationUseCase` | `GET /vehicles/organization/:organizationId` | Org Admin |
| `FindVehicleByIdUseCase` | `GET /vehicles/:id` | Org Admin |
| `UpdateVehicleUseCase` | `PUT /vehicles/:id` | Org Admin |
| `RemoveVehicleUseCase` | `DELETE /vehicles/:id` | Org Admin |

### Business Rules

- `plate` must be unique across the entire system; `PlateAlreadyInUseError` is thrown on conflict.
- `maxCapacity` must be a positive integer; `InvalidMaxCapacityError` is thrown otherwise.
- `DELETE /vehicles/:id` performs a **soft delete** — the vehicle is set to `INACTIVE` rather than
  hard-deleted, to preserve historical trip assignment references (`onDelete: Restrict` on `tripInstance`).
- Inactive vehicles cannot be updated until reactivated via `status: ACTIVE` in the update payload.

---

## Domain Errors

| Error Class | HTTP | Code |
|---|---|---|
| `InvalidPlateError` | 400 | `INVALID_PLATE` |
| `PlateAlreadyInUseError` | 409 | `PLATE_ALREADY_IN_USE` |
| `InvalidMaxCapacityError` | 400 | `INVALID_MAX_CAPACITY` |
| `VehicleNotFoundError` | 404 | `VEHICLE_NOT_FOUND` |
| `VehicleAccessForbiddenError` | 403 | `VEHICLE_ACCESS_FORBIDDEN` |
| `VehicleInactiveError` | 400 | `VEHICLE_INACTIVE` |
| `VehicleCreationFailedError` | 400 | `VEHICLE_CREATION_FAILED` |
| `VehicleUpdateFailedError` | 400 | `VEHICLE_UPDATE_FAILED` |

---

## Module Dependencies

```
VehicleModule
  ├── PrismaModule    (PrismaService)
  └── SharedModule    (guards, decorators, exceptions)

Exports:
  VehicleRepository  → consumed by TripModule (AssignVehicleToTripInstanceUseCase)
```

---

## Architecture

```
vehicle/
  domain/
    entities/
      vehicle.entity.ts               # VehicleEntity aggregate root
      errors/
        vehicle.errors.ts             # Domain errors → HTTP codes
      value-objects/
        plate.value-object.ts         # Plate VO — Brazilian plate validation
    interfaces/
      vehicle.repository.ts           # Abstract repository contract
      enums/
        vehicle-status.enum.ts        # ACTIVE | INACTIVE
        vehicle-type.enum.ts          # VAN | BUS | MINIBUS | CAR
  application/
    use-cases/                        # One file per use case
    dtos/
      create-vehicle.dto.ts           # POST input
      update-vehicle.dto.ts           # PUT input (all fields optional)
      vehicle-response.dto.ts         # Shared output DTO
  infrastructure/
    db/
      mappers/
        vehicle.mapper.ts             # Prisma Vehicle ↔ VehicleEntity
      repositories/
        prisma-vehicle.repository.ts  # Prisma implementation
  presentation/
    controllers/
      vehicle.controller.ts           # Base path: /vehicles
    mappers/
      vehicle.presenter.ts            # VehicleEntity → VehicleResponseDto
  vehicle.module.ts
```

---

## Guards & Access Control

All endpoints require **organisation administrator** access:

| Guard | Applied to |
|---|---|
| `JwtAuthGuard` | All endpoints (controller-level) |
| `RolesGuard` + `@Roles(ADMIN)` | All endpoints (method-level) |
| `TenantFilterGuard` | All endpoints (method-level) |
