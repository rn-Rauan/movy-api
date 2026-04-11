# Driver Module

## Overview

The Driver Module handles all driver-related operations in the Movy API. It extends the User entity with driver-specific information like CNH (driver's license) and organizational affiliations.

## Architecture

This module follows Clean Architecture and SOLID principles with clear separation of concerns:

```
application/     → Use Cases and DTOs
domain/          → Business Logic, Entities, Interfaces
infrastructure/  → Database Implementation (Prisma)
presentation/    → Controllers, Presenters
```

## Features

- ✅ Create, Read, Update, Delete (CRUD) operations for drivers
- ✅ Multi-tenant Driver Management
- ✅ RBAC (Role-Based Access Control) via Guards
- ✅ CNH (Driver License) Management
- ✅ Driver Status Management (ACTIVE, INACTIVE, SUSPENDED)
- ✅ Pagination Support
- ✅ Swagger/OpenAPI Documentation

## API Endpoints

### Public Endpoints

- `GET /drivers/me` - Get current driver profile (authenticated driver only)

### Admin Endpoints (ADMIN role required + RBAC Guards)

- `POST /drivers` - Create a new driver
- `GET /drivers/:id` - Find driver by ID
- `GET /drivers/organization/:organizationId` - List all drivers in organization (with pagination)
- `PUT /drivers/:id` - Update driver information
- `DELETE /drivers/:id` - Delete/remove driver record

## DTOs

### CreateDriverDto

```typescript
{
  userId: string (UUID);
  organizationId: string (UUID);
  cnh: string (9-12 chars);
  cnhCategory: enum ('A' | 'B' | 'C' | 'D' | 'E');
  cnhExpiresAt: ISO date;
}
```

### UpdateDriverDto

All fields are optional:

```typescript
{
  cnh?: string;
  cnhCategory?: enum;
  cnhExpiresAt?: ISO date;
  status?: enum ('ACTIVE' | 'INACTIVE' | 'SUSPENDED');
}
```

### DriverResponseDto

```typescript
{
  id: string;
  userId: string;
  organizationId: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiresAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Domain Errors

The module includes custom domain errors for better error handling:

- `InvalidCnhError` - Invalid CNH format
- `InvalidCnhCategoryError` - Invalid license category
- `InvalidCnhExpirationError` - Invalid expiration date
- `ExpiredCnhError` - Driver license has expired
- `InvalidDriverStatusError` - Invalid driver status
- `DriverNotFoundError` - Driver not found

## Use Cases

1. **CreateDriverUseCase** - Create a new driver with CNH validation
2. **FindDriverByIdUseCase** - Retrieve driver by ID
3. **FindDriverByUserIdUseCase** - Retrieve driver for specific user
4. **UpdateDriverUseCase** - Update driver information
5. **RemoveDriverUseCase** - Remove driver from database
6. **FindAllDriversByOrganizationUseCase** - List all drivers with pagination

## Security

- JWT Authentication required for all endpoints
- Role-based access control (RBAC) for admin operations
- Tenant filtering to prevent unauthorized access
- Multi-tenant isolation at database level

## Example Usage

### Create a Driver (Admin)

```bash
POST /drivers
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "cnh": "123456789",
  "cnhCategory": "B",
  "cnhExpiresAt": "2028-12-31"
}
```

### Get Driver Profile

```bash
GET /drivers/me
Authorization: Bearer <token>
```

## Database Schema

```prisma
model Driver {
  id             String   @id @default(uuid())
  userId         String   @unique
  organizationId String
  cnh            String   @unique
  cnhCategory    String
  cnhExpiresAt   DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user           User     @relation("DriverUser", fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation("DriverOrganization", fields: [organizationId], references: [id], onDelete: Cascade)
  tripInstances  TripInstance[] @relation("TripDriver")

  @@index([organizationId])
  @@map("driver")
}
```

## Testing

Run tests with:

```bash
npm run test -- src/modules/driver
```
