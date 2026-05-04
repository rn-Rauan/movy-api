# Movy API — Frontend Reference

Base URL (dev): `http://localhost:5701`  
Swagger UI (dev): `http://localhost:5701/api`

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

The access token expires in **1 hour**. Use `POST /auth/refresh` to get a new one without re-logging in.

---

## Pagination

Paginated endpoints accept `?page=1&limit=10` query params and always return:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

## Access Levels

| Label | Meaning |
|---|---|
| 🌐 Public | No auth required |
| 🔒 JWT | Any logged-in user |
| 🛡️ ADMIN | Requires ADMIN role in the relevant organization |
| 🧑‍💻 DEV | Dev-only emails (bypass all tenant checks) |

---

## Auth

### `POST /auth/register`
Register a new individual user account (no organization).

**Body**
| Field | Type | Required |
|---|---|---|
| `name` | string | ✅ |
| `email` | string | ✅ |
| `password` | string (min 8) | ✅ |
| `telephone` | string | ✅ |

**Response `201`** → [TokenResponse](#tokenresponse)

---

### `POST /auth/register-organization`
Atomically register a user + organization. Use this for the onboarding flow.

**Body**
| Field | Type | Required |
|---|---|---|
| `userName` | string | ✅ |
| `userEmail` | string | ✅ |
| `userPassword` | string (min 8) | ✅ |
| `userTelephone` | string | ✅ |
| `organizationName` | string | ✅ |
| `cnpj` | string | ✅ |
| `organizationEmail` | string | ✅ |
| `organizationTelephone` | string | ✅ |
| `address` | string | ✅ |
| `slug` | string | ✅ |

**Response `201`** → [TokenResponse](#tokenresponse)  
**`409`** → User or organization already exists

---

### `POST /auth/login`
Login with email + password.

**Body**
| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`** → [TokenResponse](#tokenresponse)  
**`401`** → Invalid credentials

---

### `POST /auth/refresh`
Exchange a refresh token for a new access token + refresh token pair. Always replace both tokens in storage.

**Body**
| Field | Type | Required |
|---|---|---|
| `refreshToken` | string | ✅ |

**Response `200`** → [TokenResponse](#tokenresponse)  
**`401`** → Refresh token expired or revoked

---

### `POST /auth/logout`
Revoke the refresh token (server-side). Call on user logout. Idempotent — always returns 204 even if token is already expired.

**Body**
| Field | Type | Required |
|---|---|---|
| `refreshToken` | string | ✅ |

**Response `204`** → No content

---

### `POST /auth/setup-organization` 🔒 JWT
Create an organization for a user that already has an account (without a org yet). Returns new tokens with org context embedded.

**Body**
| Field | Type | Required |
|---|---|---|
| `organizationName` | string | ✅ |
| `cnpj` | string | ✅ |
| `organizationEmail` | string | ✅ |
| `organizationTelephone` | string | ✅ |
| `address` | string | ✅ |
| `slug` | string | ✅ |

**Response `201`** → [TokenResponse](#tokenresponse)  
**`409`** → Organization already exists

---

## Users

### `GET /users/me` 🔒 JWT
Get the current user's profile.

**Response `200`** → [UserResponse](#userresponse)

---

### `PUT /users/me` 🔒 JWT
Update the current user's profile. All fields are optional.

**Body**
| Field | Type |
|---|---|
| `name` | string |
| `email` | string |
| `telephone` | string |
| `password` | string (min 8) |

**Response `200`** → [UserResponse](#userresponse)

---

### `DELETE /users/me` 🔒 JWT
Soft-disable the current user's account (status → INACTIVE).

**Response `200`**
```json
{ "success": true, "message": "User account disabled" }
```

---

## Organizations

### `GET /public/organizations/{slug}` 🌐 Public
Resolve an organization by its URL slug. Use on the landing/home page to identify the tenant.

**Path params:** `slug` — e.g., `transport-xpto`

**Response `200`** → [OrganizationResponse](#organizationresponse)  
**`404`** → Org not found or inactive

---

### `GET /organizations/me` 🔒 JWT
List all organizations the current user belongs to (paginated).

**Query:** `?page=1&limit=10`

**Response `200`** → Paginated [[OrganizationResponse](#organizationresponse)]

---

### `GET /organizations/{id}` 🛡️ ADMIN
Get an organization by ID.

**Response `200`** → [OrganizationResponse](#organizationresponse)

---

### `PUT /organizations/{id}` 🛡️ ADMIN
Update an organization.

**Body** (all optional)
| Field | Type |
|---|---|
| `name` | string |
| `email` | string |
| `cnpj` | string |
| `telephone` | string |
| `slug` | string |
| `address` | string |

**Response `200`** → [OrganizationResponse](#organizationresponse)

---

### `DELETE /organizations/{id}` 🛡️ ADMIN
Soft-disable an organization (status → INACTIVE).

**Response `200`** → `boolean`

---

## Memberships

### `GET /memberships/me/role/{organizationId}` 🔒 JWT (ADMIN or DRIVER)
Get the current user's role in a specific organization. Requires the caller to have an ADMIN or DRIVER role in the org.

**Response `200`** → `{ id: number, name: "ADMIN" | "DRIVER" }`

---

### `POST /memberships/driver` 🛡️ ADMIN
Associate a driver to the organization by email **and** CNH. Both must match the same user — this prevents linking someone whose CNH you don't know.

Use `GET /drivers/lookup` first if you only have one of the two identifiers.

**Body**
| Field | Type | Required |
|---|---|---|
| `userEmail` | string | ✅ |
| `cnh` | string | ✅ |

**Response `201`** → [MembershipResponse](#membershipresponse)  
**`400`** → CNH doesn't match the user or user has no driver profile  
**`403`** → Driver plan limit exceeded  
**`404`** → No user found with that email  
**`409`** → Active DRIVER membership already exists

---

### `POST /memberships` 🛡️ ADMIN
Add a user to an organization with a specific role. Lookup the user by email first.

**Body**
| Field | Type | Required |
|---|---|---|
| `userEmail` | string | ✅ |
| `roleId` | number | ✅ |

**Response `201`** → [MembershipResponse](#membershipresponse)

---

### `GET /memberships/organization/{organizationId}` 🛡️ ADMIN
List all memberships in an organization (paginated).

**Response `200`** → Paginated [[MembershipResponse](#membershipresponse)]

---

### `DELETE /memberships/{userId}/{roleId}/{organizationId}` 🛡️ ADMIN
Soft-remove a membership (sets `removedAt`).

**Response `200`** → `boolean`

---

### `PATCH /memberships/{userId}/{roleId}/{organizationId}/restore` 🛡️ ADMIN
Restore a previously removed membership.

**Response `200`** → `boolean`

---

## Drivers

### `POST /drivers` 🔒 JWT
Register a driver profile for the current user. The user must be a member of the org.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `cnh` | string | ✅ | 9–12 chars |
| `cnhCategory` | `"A"` \| `"B"` \| `"C"` \| `"D"` \| `"E"` | ✅ | |
| `cnhExpiresAt` | string (YYYY-MM-DD) | ✅ | |

**Response `201`** → [DriverResponse](#driverresponse)

---

### `GET /drivers/me` 🔒 JWT
Get the current user's driver profile.

**Response `200`** → [DriverResponse](#driverresponse)

---

### `GET /drivers/lookup` 🛡️ ADMIN
Look up a driver by email + CNH (to get their `userId` before creating a membership).

**Query:** `?email=joao@email.com&cnh=123456789`

**Response `200`** → `{ driverId, userId, userName, userEmail, cnhCategory, cnhExpiresAt, driverStatus }`

---

### `GET /drivers/organization/{organizationId}` 🛡️ ADMIN
List all drivers in an organization (paginated).

**Response `200`** → Paginated [[DriverResponse](#driverresponse)]

---

### `GET /drivers/{id}` 🛡️ ADMIN
Get a driver by ID.

**Response `200`** → [DriverResponse](#driverresponse)

---

### `PUT /drivers/{id}` �️ ADMIN
Update a driver profile. All fields optional.

**Body**
| Field | Type | Notes |
|---|---|---|
| `cnh` | string | |
| `cnhCategory` | `"A"`\|`"B"`\|`"C"`\|`"D"`\|`"E"` | |
| `cnhExpiresAt` | string (YYYY-MM-DD) | |
| `status` | `"ACTIVE"`\|`"INACTIVE"`\|`"SUSPENDED"` | |

**Response `200`** → [DriverResponse](#driverresponse)

---

### `DELETE /drivers/{id}` 🛡️ ADMIN
Delete a driver profile.

**Response `200`** → `boolean`

---

## Vehicles

### `POST /vehicles/organization/{organizationId}` 🛡️ ADMIN
Register a vehicle for an organization.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `plate` | string (max 7) | ✅ | Old format: `ABC1234` / Mercosul: `ABC1D23` |
| `model` | string | ✅ | e.g. `"Mercedes-Benz Sprinter"` |
| `type` | `"VAN"`\|`"BUS"`\|`"MINIBUS"`\|`"CAR"` | ✅ | |
| `maxCapacity` | number (1–200) | ✅ | |

**Response `201`** → [VehicleResponse](#vehicleresponse)

---

### `GET /vehicles/organization/{organizationId}` 🛡️ ADMIN
List all vehicles in an organization (paginated).

**Response `200`** → Paginated [[VehicleResponse](#vehicleresponse)]

---

### `GET /vehicles/{id}` 🛡️ ADMIN
Get a vehicle by ID.

**Response `200`** → [VehicleResponse](#vehicleresponse)

---

### `PUT /vehicles/{id}` 🛡️ ADMIN
Update a vehicle. All fields optional.

**Body**
| Field | Type |
|---|---|
| `plate` | string |
| `model` | string |
| `type` | `"VAN"`\|`"BUS"`\|`"MINIBUS"`\|`"CAR"` |
| `maxCapacity` | number |
| `status` | `"ACTIVE"`\|`"INACTIVE"` |

**Response `200`** → [VehicleResponse](#vehicleresponse)

---

### `DELETE /vehicles/{id}` 🛡️ ADMIN
Soft-deactivate a vehicle (status → INACTIVE).

**Response `200`** → `boolean`

---

## Trip Templates

A trip template defines the recurring structure of a route (stops, prices, schedule).

### `POST /trip-templates/organization/{organizationId}` 🛡️ ADMIN
Create a trip template.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `departurePoint` | string (max 255) | ✅ | |
| `destination` | string (max 255) | ✅ | |
| `stops` | string[] (min 2) | ✅ | Ordered stop names |
| `shift` | `"MORNING"`\|`"AFTERNOON"`\|`"EVENING"` | ✅ | |
| `frequency` | `("SUNDAY"\|"MONDAY"\|...\|"SATURDAY")[]` | | Recurrence days |
| `priceOneWay` | number | | BRL |
| `priceReturn` | number | | BRL |
| `priceRoundTrip` | number | | BRL |
| `isPublic` | boolean | | Visible on public listing (default: `false`) |
| `isRecurring` | boolean | | |
| `autoCancelEnabled` | boolean | | |
| `minRevenue` | number | | Required if `autoCancelEnabled = true` |
| `autoCancelOffset` | number | | Minutes before departure (required if `autoCancelEnabled = true`) |

**Response `201`** → [TripTemplateResponse](#triptemplateresponse)

---

### `GET /trip-templates/organization/{organizationId}` 🛡️ ADMIN
List all trip templates in an organization (paginated).

**Response `200`** → Paginated [[TripTemplateResponse](#triptemplateresponse)]

---

### `GET /trip-templates/{id}` 🛡️ ADMIN
Get a trip template by ID.

**Response `200`** → [TripTemplateResponse](#triptemplateresponse)

---

### `PUT /trip-templates/{id}` 🛡️ ADMIN
Update a trip template. All fields optional.

**Response `200`** → [TripTemplateResponse](#triptemplateresponse)

---

### `DELETE /trip-templates/{id}` 🛡️ ADMIN
Deactivate a trip template (soft delete).

**Response `200`** → `boolean`

---

## Trip Instances

A trip instance is a scheduled occurrence of a trip template (a real departure on a specific date/time).

### `POST /trip-instances/organization/{organizationId}` 🛡️ ADMIN
Create a trip instance from a template.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `tripTemplateId` | string (UUID) | ✅ | |
| `departureTime` | string (ISO 8601) | ✅ | e.g. `"2026-05-10T07:30:00.000Z"` |
| `arrivalEstimate` | string (ISO 8601) | ✅ | Must be after `departureTime` |
| `totalCapacity` | number | ✅ | Seat count snapshot |
| `driverId` | string (UUID) | | Required if `initialStatus = "SCHEDULED"` |
| `vehicleId` | string (UUID) | | Required if `initialStatus = "SCHEDULED"` |
| `minRevenue` | number | | Override template min revenue |
| `initialStatus` | `"DRAFT"` \| `"SCHEDULED"` | | Default: `"DRAFT"`. Use `"SCHEDULED"` to publish immediately (requires driver + vehicle) |

**Response `201`** → [TripInstanceResponse](#tripinstanceresponse)

---

### `GET /trip-instances/organization/{organizationId}` 🛡️ ADMIN
List all trip instances for an organization (paginated). Returns an **enriched response** with booking occupancy and denormalized template fields — all resolved in a single query (no N+1).

**Response `200`** → Paginated [[TripInstanceResponse](#tripinstanceresponse)]

---

### `GET /trip-instances/template/{templateId}` 🛡️ ADMIN
List all instances for a specific template (paginated).

**Response `200`** → Paginated [[TripInstanceResponse](#tripinstanceresponse)]

---

### `GET /trip-instances/{id}` 🔒 JWT
Get a trip instance by ID.

**Response `200`** → [TripInstanceResponse](#tripinstanceresponse)

---

### `PATCH /trip-instances/{id}/status` 🛡️ ADMIN
Transition a trip instance to a new lifecycle status.

**Status flow:** `DRAFT → SCHEDULED → CONFIRMED → IN_PROGRESS → FINISHED`  
Can also go to `CANCELED` from `DRAFT`, `SCHEDULED`, or `CONFIRMED`.

**Body**
| Field | Type | Required |
|---|---|---|
| `newStatus` | `"DRAFT"`\|`"SCHEDULED"`\|`"CONFIRMED"`\|`"IN_PROGRESS"`\|`"FINISHED"`\|`"CANCELED"` | ✅ |

**Response `200`** → [TripInstanceResponse](#tripinstanceresponse)

---

### `PUT /trip-instances/{id}/driver` 🛡️ ADMIN
Assign or unassign a driver to a trip instance.

**Query:** `?driverId=<uuid>` (omit to unassign)

**Response `200`** → [TripInstanceResponse](#tripinstanceresponse)

---

### `PUT /trip-instances/{id}/vehicle` 🛡️ ADMIN
Assign or unassign a vehicle to a trip instance.

**Query:** `?vehicleId=<uuid>` (omit to unassign)

**Response `200`** → [TripInstanceResponse](#tripinstanceresponse)

---

## Public Trips

No authentication required. Used for the public listing/booking pages.

### `GET /public/trip-instances` 🌐 Public
List all public trips (from `isPublic = true` templates) with status `SCHEDULED` or `CONFIRMED`, ordered by departure time.

**Query**
| Param | Type | Notes |
|---|---|---|
| `page` | number | |
| `limit` | number | |
| `organizationId` | string (UUID) | Optional: filter by org |

**Response `200`** → Paginated [[PublicTripInstanceResponse](#publictripinstanceresponse)]

---

### `GET /public/trip-instances/{id}` 🌐 Public
Get a single bookable trip instance by ID (must be `SCHEDULED` or `CONFIRMED`).

**Response `200`** → [PublicTripInstanceResponse](#publictripinstanceresponse)  
**`404`** → Not found or not bookable

---

### `GET /public/trip-instances/org/{slug}` 🌐 Public
List all `SCHEDULED`/`CONFIRMED` trips for an organization by its slug (org-specific share link page). Returns all trips regardless of `isPublic`.

**Query:** `?page=1&limit=10`

**Response `200`** → Paginated [[PublicTripInstanceResponse](#publictripinstanceresponse)]

---

## Bookings

### `POST /bookings` 🔒 JWT
Enroll the authenticated user in a trip instance. Creates a booking + payment record.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `tripInstanceId` | string (UUID) | ✅ | |
| `enrollmentType` | `"ONE_WAY"`\|`"RETURN"`\|`"ROUND_TRIP"` | ✅ | |
| `boardingStop` | string | ✅ | Must match a stop in the template |
| `alightingStop` | string | ✅ | Must match a stop in the template |
| `method` | `"MONEY"`\|`"PIX"`\|`"CREDIT_CARD"`\|`"DEBIT_CARD"` | ✅ | |

**Response `201`** → [BookingResponse](#bookingresponse)

---

### `GET /bookings/availability/{tripInstanceId}` 🔒 JWT
Check available slots before booking (use before showing the booking form).

**Response `200`**
```json
{
  "tripInstanceId": "uuid",
  "tripStatus": "SCHEDULED",
  "totalCapacity": 40,
  "activeCount": 28,
  "availableSlots": 12,
  "isBookable": true
}
```

---

### `GET /bookings/user` 🔒 JWT
List the current user's bookings (paginated).

**Query**
| Param | Type | Notes |
|---|---|---|
| `page` | number | |
| `limit` | number | |
| `status` | `"ACTIVE"`\|`"INACTIVE"` | Optional filter |

**Response `200`** → Paginated [[BookingResponse](#bookingresponse)]

---

### `GET /bookings/{id}` 🔒 JWT
Get a booking by ID.

**Response `200`** → [BookingResponse](#bookingresponse)

---

### `GET /bookings/{id}/details` 🔒 JWT
Get a booking with enriched trip data (departure time, trip status, available slots). Use on the booking detail page.

**Response `200`** → [BookingDetailsResponse](#bookingdetailsresponse)

---

### `GET /bookings/trip-instance/{tripInstanceId}` 🔒 JWT
List all bookings for a specific trip instance (paginated). Requires org membership.

**Response `200`** → Paginated [[BookingResponse](#bookingresponse)]

---

### `GET /bookings/trip-instance/{tripInstanceId}/passengers` 🔒 JWT
List the name, boarding stop, and userId of every active passenger on a trip instance.

Access is granted if the caller has an `ACTIVE` booking on the trip **or** is a member of the owning organization. Sensitive fields (email, phone) are never included.

**Response `200`** → [[TripPassengerResponse](#trippassengerresponse)]  
**`403`** → Caller has no active booking and is not an org member  
**`404`** → Trip instance not found

---

### `GET /bookings/organization/{organizationId}` 🛡️ ADMIN
List all bookings in an organization (paginated).

**Response `200`** → Paginated [[BookingResponse](#bookingresponse)]

---

### `PATCH /bookings/{id}/cancel` 🔒 JWT
Cancel a booking (status → INACTIVE). Frees up a seat.

The booking owner can cancel their own booking. ADMIN or DRIVER members of the owning organisation can also cancel any booking within that org. Cancellation is blocked if the trip is `IN_PROGRESS`/`FINISHED` or departure is within 30 minutes.

**Response `200`** → [BookingResponse](#bookingresponse)

---

### `PATCH /bookings/{id}/confirm-presence` 🔒 JWT (or ADMIN)
Mark passenger as present on the trip.

**Response `200`** → [BookingResponse](#bookingresponse)

---

## Subscriptions

### `POST /organizations/{organizationId}/subscriptions` 🛡️ ADMIN
Subscribe an organization to a plan.

**Body**
| Field | Type | Required |
|---|---|---|
| `planId` | number | ✅ |

**Response `201`** → [SubscriptionResponse](#subscriptionresponse)

---

### `GET /organizations/{organizationId}/subscriptions/active` 🛡️ ADMIN
Get the current active subscription for an organization.

**Response `200`** → [SubscriptionResponse](#subscriptionresponse)

---

### `GET /organizations/{organizationId}/subscriptions` 🛡️ ADMIN
List all subscriptions for an organization (paginated).

**Response `200`** → Paginated [[SubscriptionResponse](#subscriptionresponse)]

---

### `PATCH /organizations/{organizationId}/subscriptions/{id}/cancel` 🛡️ ADMIN
Cancel a subscription. Takes effect at `expiresAt`.

**Response `200`** → [SubscriptionResponse](#subscriptionresponse)

---

## Plans

### `GET /plans` 🔒 JWT
List all available plans (paginated).

**Response `200`** → Paginated [[PlanResponse](#planresponse)]

---

### `GET /plans/{id}` 🔒 JWT
Get a plan by ID.

**Response `200`** → [PlanResponse](#planresponse)

---

## Payments

Payments are created automatically when a booking is made. Use these endpoints to display payment history.

### `GET /organizations/{organizationId}/payments` 🛡️ ADMIN
List all payments for an organization (paginated).

**Response `200`** → Paginated [[PaymentResponse](#paymentresponse)]

---

### `GET /organizations/{organizationId}/payments/{id}` 🛡️ ADMIN
Get a payment by ID.

**Response `200`** → [PaymentResponse](#paymentresponse)

---

### `PATCH /organizations/{organizationId}/payments/{id}/confirm` 🛡️ ADMIN
Confirm a PENDING payment (simulated — no real payment gateway).

**Response `200`** → [PaymentResponse](#paymentresponse)

---

### `PATCH /organizations/{organizationId}/payments/{id}/fail` 🛡️ ADMIN
Fail a PENDING payment (simulated).

**Response `200`** → [PaymentResponse](#paymentresponse)

---

## Response Schemas

### TokenResponse
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### UserResponse
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "telephone": "11999999999",
  "status": "ACTIVE",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### OrganizationResponse
```json
{
  "id": "uuid",
  "name": "My Org",
  "cnpj": "12345678000199",
  "email": "org@email.com",
  "telephone": "11999999999",
  "slug": "my-org",
  "address": "Rua Exemplo, 123",
  "status": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### MembershipResponse
```json
{
  "userId": "uuid",
  "roleId": 1,
  "organizationId": "uuid",
  "assignedAt": "2026-01-01T00:00:00.000Z",
  "removedAt": null
}
```

### DriverResponse
```json
{
  "id": "uuid",
  "userId": "uuid",
  "cnh": "123456789",
  "cnhCategory": "B",
  "cnhExpiresAt": "2028-12-31T00:00:00.000Z",
  "driverStatus": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### VehicleResponse
```json
{
  "id": "uuid",
  "plate": "ABC1D23",
  "model": "Mercedes-Benz Sprinter",
  "type": "VAN",
  "maxCapacity": 15,
  "status": "ACTIVE",
  "organizationId": "uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### TripTemplateResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "departurePoint": "Terminal Rodoviário",
  "destination": "Universidade Federal",
  "stops": ["Terminal Rodoviário", "Praça Central", "Universidade Federal"],
  "shift": "MORNING",
  "frequency": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "priceOneWay": 12.50,
  "priceReturn": 12.50,
  "priceRoundTrip": 20.00,
  "isPublic": false,
  "isRecurring": true,
  "autoCancelEnabled": false,
  "minRevenue": null,
  "autoCancelOffset": null,
  "status": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### TripInstanceResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "tripTemplateId": "uuid",
  "driverId": "uuid or null",
  "vehicleId": "uuid or null",
  "tripStatus": "SCHEDULED",
  "totalCapacity": 40,
  "minRevenue": null,
  "autoCancelAt": null,
  "forceConfirm": false,
  "isPublic": false,
  "departureTime": "2026-05-10T07:30:00.000Z",
  "arrivalEstimate": "2026-05-10T08:15:00.000Z",
  "createdAt": "...",
  "updatedAt": "...",

  // Fields below are only populated on GET /trip-instances/organization/{organizationId}
  // (resolved via a single JOIN query — no extra round-trips)
  "bookedCount": 28,
  "availableSlots": 12,
  "departurePoint": "Terminal Rodoviário",
  "destination": "Universidade Federal",
  "priceOneWay": 12.50,
  "priceReturn": 12.50,
  "priceRoundTrip": 20.00,
  "isRecurring": true
}
```

### PublicTripInstanceResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "tripTemplateId": "uuid",
  "tripStatus": "SCHEDULED",
  "departureTime": "2026-05-10T07:30:00.000Z",
  "arrivalEstimate": "2026-05-10T08:15:00.000Z",
  "totalCapacity": 40,
  "departurePoint": "Terminal Rodoviário",
  "destination": "Universidade Federal",
  "priceOneWay": 12.50,
  "priceReturn": 12.50,
  "priceRoundTrip": 20.00,
  "isRecurring": true
}
```

### BookingResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "userId": "uuid",
  "tripInstanceId": "uuid",
  "enrollmentDate": "2026-05-01T10:00:00.000Z",
  "status": "ACTIVE",
  "presenceConfirmed": false,
  "enrollmentType": "ONE_WAY",
  "recordedPrice": 12.50,
  "boardingStop": "Terminal Rodoviário",
  "alightingStop": "Universidade Federal",
  "paymentMethod": "PIX",
  "createdAt": "...",
  "updatedAt": "..."
}
```

> `paymentMethod` is `null` when the booking was created before this field was introduced or if not resolved from the payment record.

### TripPassengerResponse
```json
[
  { "userId": "uuid", "name": "João Silva", "boardingStop": "A2" },
  { "userId": "uuid", "name": "Maria Souza", "boardingStop": "B1" }
]
```

### BookingDetailsResponse
Same as BookingResponse plus:
```json
{
  "tripDepartureTime": "2026-06-15T07:30:00.000Z",
  "tripArrivalEstimate": "2026-06-15T09:00:00.000Z",
  "tripStatus": "SCHEDULED",
  "totalCapacity": 40,
  "availableSlots": 12
}
```

### SubscriptionResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "planId": 1,
  "status": "ACTIVE",
  "startDate": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2026-02-01T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PlanResponse
```json
{
  "id": 1,
  "name": "FREE",
  "price": 0,
  "maxVehicles": 1,
  "maxDrivers": 2,
  "maxMonthlyTrips": 10,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PaymentResponse
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "enrollmentId": "uuid",
  "method": "PIX",
  "amount": 12.50,
  "status": "PENDING",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Common Errors

| HTTP | When |
|---|---|
| `400` | Validation failed (missing/invalid fields) |
| `401` | Missing or invalid JWT / expired refresh token |
| `403` | Insufficient role or plan limit exceeded |
| `404` | Resource not found |
| `409` | Duplicate (user/org/vehicle already exists) |
