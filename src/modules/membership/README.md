# Membership Module

Manages the `OrganizationMembership` join aggregate — the source of truth for
RBAC and multi-tenancy in Movy. Each membership binds a **user**, a **role**,
and an **organization** via a composite primary key
`(userId, roleId, organizationId)`. Soft-removal is used: `removedAt` is stamped
instead of physical deletion.

---

## Entity

| Field | Type | Notes |
|---|---|---|
| `userId` | `string` (UUID v4) | FK → User |
| `roleId` | `number` | FK → Role (1 = ADMIN, 2 = DRIVER) |
| `organizationId` | `string` (UUID v4) | FK → Organization |
| `assignedAt` | `Date` | Defaults to `now` on creation |
| `removedAt` | `Date \| null` | `null` = active; non-null = soft-removed |

Mutating methods: `remove()` (stamps `removedAt`), `restoreMembership()` (clears it).

---

## Domain Errors

| Class | HTTP | Code |
|---|---|---|
| `MembershipNotFoundError` | 404 | `MEMBERSHIP_NOT_FOUND` |
| `MembershipAlreadyExistsError` | 409 | `MEMBERSHIP_ALREADY_EXISTS` |
| `UserNotFoundForMembershipError` | 404 | `USER_FOR_MEMBERSHIP_NOT_FOUND` |
| `MembershipMissingIdentifierError` | 400 | `MEMBERSHIP_MISSING_IDENTIFIER_BAD_REQUEST` |
| `DriverNotFoundForMembershipError` | 400 | `DRIVER_NOT_FOUND_FOR_MEMBERSHIP_BAD_REQUEST` |

---

## API Endpoints

| Method | Path | Guard | Use Case |
|---|---|---|---|
| `GET` | `/memberships/me/role/:organizationId` | `RolesGuard(ADMIN, DRIVER)` | `FindRoleByUserIdAndOrganizationIdUseCase` |
| `POST` | `/memberships` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `CreateMembershipUseCase` |
| `GET` | `/memberships/user/:userId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipsByUserUseCase` |
| `GET` | `/memberships/organization/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipsByOrganizationUseCase` |
| `GET` | `/memberships/:userId/:roleId/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `FindMembershipByCompositeKeyUseCase` |
| `PATCH` | `/memberships/:userId/:roleId/:organizationId/restore` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `RestoreMembershipUseCase` |
| `DELETE` | `/memberships/:userId/:roleId/:organizationId` | `RolesGuard(ADMIN)` + `TenantFilterGuard` | `RemoveMembershipUseCase` |

---

## Use Cases

| Class | Description |
|---|---|
| `CreateMembershipUseCase` | Resolves user by email; validates DRIVER prerequisites; auto-restores if previously removed; else creates new membership |
| `FindMembershipByCompositeKeyUseCase` | Finds by `(userId, roleId, organizationId)` — throws if absent |
| `FindMembershipsByUserUseCase` | Paginated list for a user, optional org filter |
| `FindMembershipsByOrganizationUseCase` | Paginated list for an organization |
| `FindRoleByUserIdAndOrganizationIdUseCase` | Returns the `Role` entity for a user in an org |
| `RemoveMembershipUseCase` | Soft-remove: stamps `removedAt` |
| `RestoreMembershipUseCase` | Restore: clears `removedAt` |

---

## Module Structure

```
src/modules/membership/
├── membership.module.ts
├── application/
│   ├── dtos/
│   │   ├── create-membership.dto.ts
│   │   ├── membership-response.dto.ts
│   │   └── role-response.dto.ts
│   └── use-cases/
│       ├── create-membership.use-case.ts
│       ├── find-membership-by-composite-key.use-case.ts
│       ├── find-memberships-by-organization.use-case.ts
│       ├── find-memberships-by-user.use-case.ts
│       ├── find-role-by-user-and-organization.use-case.ts
│       ├── remove-membership.use-case.ts
│       └── restore-membership.use-case.ts
├── domain/
│   ├── entities/
│   │   ├── membership.entity.ts
│   │   └── errors/
│   │       └── membership.errors.ts
│   └── interfaces/
│       └── membership.repository.ts
├── infrastructure/
│   └── db/
│       ├── mappers/
│       │   └── membership.mapper.ts         # Prisma ↔ Domain
│       └── repositories/
│           └── prisma-membership.repository.ts
└── presentation/
    ├── controllers/
    │   └── membership.controller.ts
    └── mappers/
        └── membership.presenter.ts          # MembershipPresenter (DI instance)
```

---

## Module Dependencies

**Imports:** `SharedModule`, `forwardRef(() => UserModule)`, `DriverModule`

**Providers:**
- `PrismaMembershipRepository` bound to the `MembershipRepository` token
- `MembershipPresenter` (instance — injected into controller)
- All 7 use case classes

**Exports:** All use cases + `MembershipRepository` token

- Mapeia entre domínio e persistência via `MembershipMapper`.

### MembershipMapper
- Converte `Membership` (domínio) ↔ `OrganizationMembership` (Prisma).

## Apresentação

### MembershipController
- Endpoints REST com validação de DTOs.
- Usa `MembershipPresenter` para respostas HTTP.
- Protegido por `JwtAuthGuard`.

### MembershipPresenter
- Converte entidades para `MembershipResponseDto`.

## Integração com Outros Módulos

- **User Module**: Associa usuários a organizações via roles.
- **Organization Module**: Gerencia membros de organizações.
- **Auth Module**: Base para RBAC (futuro).
- **Shared Module**: Usa providers globais (Prisma, Guards).

## Testes
- **Unitários**: Cobertura para use cases e entidades (pendente implementação).
- **Integração**: Testes E2E para endpoints (futuro).

## Dependências
- `@nestjs/common`, `@nestjs/core`
- `prisma` e `@prisma/client`
- `class-validator` para DTOs
- `src/shared/` para componentes globais

## Próximos Passos
- Implementar guards baseados em roles (RBAC).
- Adicionar testes unitários e E2E.
- Integrar com auditoria (AuditLog).